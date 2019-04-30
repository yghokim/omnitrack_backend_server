import OTUser from "../models/ot_user";
import C from '../server_consts';
import {firebaseApp} from '../app';

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
      const body: any = {
        notification: {
          title: title,
          body: message
        }
      }

      if(dataPayload)
      {
        body.data = dataPayload
      }
    return this.getInstanceIds(userId, options)
      .then(instanceIds => {
        if (instanceIds.length > 0) {
          console.log("send notificationMessage to " + instanceIds)
          return firebaseApp.messaging().sendToDevice(instanceIds, body).then(response => {
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
          return firebaseApp.messaging().sendToDevice(instanceIds, { data: messagePayload }).then(
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

  makeFullSyncMessageData(experimentId?: string): MessageData {
    if(experimentId){
      return new ExperimentData(C.PUSH_DATA_TYPE_FULL_SYNC, experimentId)
    }
    else return new MessageData(C.PUSH_DATA_TYPE_FULL_SYNC)
  }

  makeSyncMessageFromTypes(syncTypes: Array<string>): MessageData {
    return new SyncInfo(syncTypes.map(t => ({type: t})))
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

export class ExperimentData extends MessageData{
  constructor(command: string, public readonly experimentId: string, public readonly payload: any=null){
    super(command)
  }

  toMessagingPayloadJson(): any{
    const superJson = super.toMessagingPayloadJson()
    superJson.experimentId = this.experimentId
    if(this.payload != null){
      for(const key of Object.keys(this.payload)){
        superJson[key] = this.payload[key]
      }
    }
    return superJson
  }
}

export class TextMessageData extends MessageData{
  constructor(public title: string, public content: string){
    super(C.PUSH_DATA_TYPE_TEXT_MESSAGE)
  }

  toMessagingPayloadJson(): any{
    const superJson = super.toMessagingPayloadJson()
    superJson.messageTitle = this.title
    superJson.messageContent = this.content
    return superJson
  }
}

export class DataStoreMessageData extends MessageData{
  constructor(public changedKeys: Array<string>){
    super(C.PUSH_DATA_TYPE_PERSONAL_DATASTORE)
  }

  toMessagingPayloadJson(): any{
    const superJson = super.toMessagingPayloadJson()
    superJson.changedKeyArray = JSON.stringify(this.changedKeys)
    return superJson
  }
}

export class SyncInfo extends MessageData {

  constructor(public data: Array<{ type: string }>) {
    super(C.PUSH_DATA_TYPE_SYNC_DOWN);
  }

  toMessagingPayloadJson(): any {
    const superJson = super.toMessagingPayloadJson()
    superJson.syncInfoArray = JSON.stringify(this.data)
    return superJson
  }
}
