import OTUser from "../models/ot_user";
import * as admin from 'firebase-admin';
import C from '../server_consts';

export default class PushModule {

  private getInstanceIds(userId: string | string[], options: PushOptions): Promise<Array<string>> {
    const pipe: Array<any> = [
      {$match: { _id: (userId instanceof Array) ? {$in: userId} : userId }},
      {$unwind: "$devices"}
    ]

    if (options.excludeDeviceIds != null && options.excludeDeviceIds.length > 0) {
      pipe.push({$match: {"devices.deviceId": {$nin: options.excludeDeviceIds}}})
    }

    pipe.push({$project: { instanceId: "$devices.instanceId" }})

    return OTUser.aggregate(pipe).then(
      result => {
        console.log(result)
        return result.map(r => r["instanceId"])
      }
    )
  }

  /**
   *
   * @param userId user id or id array
   * @param title notification title string
   * @param message notification message string
   * @param options
   * @returns Promise with sent device ids
   */
  sendNotificationMessageToUser(userId: string | string[],
    title: string,
    message: string,
    dataPayload: any = null,
    options: PushOptions = { excludeDeviceIds: [] }): Promise<Array<string>> {
    return this.getInstanceIds(userId, options)
      .then(instanceIds => {
        if (instanceIds.length > 0) {
          console.log("send notificationMessage to " + instanceIds)
          return admin.messaging().sendToDevice(instanceIds, {
            notification: {
              title: title,
              body: message
            },
            data: dataPayload
          }).then(response => {
            console.log(response)
            return response.results.map(device => device.messageId)
          })
        }
      })
  }

  /**
   *
   * @param userId
   * @param options
   * @returns Promise with sent device ids
   */
  sendDataMessageToUser(userId: string | string[], messageData: MessageData, options: PushOptions = { excludeDeviceIds: [] }): Promise<Array<string>> {
    return this.sendDataPayloadMessageToUser(userId, messageData.toMessagingPayloadJson(), options)
  }

  /**
   *
   * @param userId
   * @param options
   * @returns Promise with sent device ids
   */
  sendDataPayloadMessageToUser(userId: string | string[], messagePayload: any, options: PushOptions = { excludeDeviceIds: [] }): Promise<Array<string>> {
    return this.getInstanceIds(userId, options)
      .then(instanceIds => {
        if (instanceIds.length > 0) {
          console.log("send dataPayloadMessage to " + instanceIds)

          // send notification to instanceIds
          return admin.messaging().sendToDevice(instanceIds, { data: messagePayload }).then(
            response => {
              console.log(response)
              return response.results.map(device => device.messageId)
            }
          ).catch((err) => {
            console.log(err)
            return []
          })
        } else {
          return []
        }
      })
  }

  sendSyncDataMessageToUser(userId: string|string[], syncTypes: Array<string>, options: PushOptions= { excludeDeviceIds: [] }): Promise<Array<string>> {
    return this.sendDataMessageToUser(userId, this.makeSyncMessageFromTypes(syncTypes), options)
  }

  makeFullSyncMessageData(): MessageData {
    return new SyncInfo([C.SYNC_TYPE_TRACKER, C.SYNC_TYPE_TRIGGER, C.SYNC_TYPE_ITEM].map(t => ({type: t})))
  }

  makeSyncMessageFromTypes(syncTypes: Array<string>): MessageData {
    return new SyncInfo(syncTypes.map(t => ({type: t})))
  }

  sendFullSyncDataMessageToUser(userId: string|string[], options: PushOptions= { excludeDeviceIds: [] }): Promise<Array<string>> {
    return this.getInstanceIds(userId, options)
    .then(instanceIds => {
      if (instanceIds.length > 0) {
        console.log("send notification to " + instanceIds)

        // send notification to instanceIds
        return admin.messaging().sendToDevice(instanceIds, { data: this.makeFullSyncMessageData().toMessagingPayloadJson() }).then(
          response => {
            console.log(response)
            return response.results.map(device => device.messageId)
          }
        ).catch((err) => {
          console.log(err)
          return []
        })
      } else {
        return []
      }
    })
  }
}

export interface PushOptions {
  excludeDeviceIds: Array<string>
}

export class MessageData {
  constructor(public readonly command: string) { }

  toMessagingPayloadJson(): any {
    return { command: this.command }
  }
}

export class SyncInfo extends MessageData {

  data: Array<{ type: string }>

  constructor(data: Array<{ type: string }>) {
    super(C.PUSH_DATA_TYPE_SYNC_DOWN);
    this.data = data
  }

  toMessagingPayloadJson(): any {
    const superJson = super.toMessagingPayloadJson()
    superJson.syncInfoArray = JSON.stringify(this.data)
    return superJson
  }
}
