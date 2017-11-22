import OTUser from "../models/ot_user";
import * as admin from 'firebase-admin';
import C from '../server_consts';

export default class PushModule {

  private getInstanceIds(userId: String, options: PushOptions): Promise<Array<string>> {
    return OTUser.findById(userId, "devices").then(user => {
      console.log("send push data to user - " + user._id)
      const instanceIds = []
      const devices = user["devices"]
      if (devices != null) {
        const excludes = options.excludeDeviceIds
        if (excludes != null) {
          devices.forEach(device => {
            if (!excludes.includes(device.deviceId)) {
              instanceIds.push(device.instanceId)
            }
          })
        } else {
          devices.forEach(device => {
            instanceIds.push(device.instanceId)
          })
        }

        return instanceIds
      }
    })
  }

  /**
   * 
   * @param userId 
   * @param options
   * @returns Promise with sent device ids 
   */
  sendDataMessageToUser(userId: string, messageData: MessageData, options: PushOptions = { excludeDeviceIds: [] }): Promise<Array<string>> {
    return this.sendDataPayloadMessageToUser(userId, messageData.toMessagingPayloadJson(), options)
  }

  /**
   * 
   * @param userId 
   * @param options
   * @returns Promise with sent device ids 
   */
  sendDataPayloadMessageToUser(userId: string, messagePayload: any, options: PushOptions = { excludeDeviceIds: [] }): Promise<Array<string>> {
    return this.getInstanceIds(userId, options)
      .then(instanceIds => {
        if (instanceIds.length > 0) {
          console.log("send notification to " + instanceIds)

          //send notification to instanceIds
          return admin.messaging().sendToDevice(instanceIds, { data: messagePayload }).then(
            response => {
              console.log(response)
              return response.results.map(device => device.messageId)
            }
          ).catch((err) => {
            console.log(err)
            return []
          })
        }
        else {
          return []
        }
      })
  }

  sendSyncDataMessageToUser(userId: string, syncTypes: Array<string>, options: PushOptions={ excludeDeviceIds: [] }): Promise<Array<string>> {
    return this.sendDataMessageToUser(userId, this.makeSyncMessageFromTypes(syncTypes), options)
  }

  makeFullSyncMessageData(): MessageData{
    return new SyncInfo([C.SYNC_TYPE_TRACKER, C.SYNC_TYPE_TRIGGER, C.SYNC_TYPE_ITEM].map(t=>{return {type:t}}))
  }

  makeSyncMessageFromTypes(syncTypes: Array<string>): MessageData{
    return new SyncInfo(syncTypes.map(t=>{return {type:t}}))
  }

  sendFullSyncDataMessageToUser(userId: string, options: PushOptions={ excludeDeviceIds: [] }): Promise<Array<string>>{
    return this.getInstanceIds(userId, options)
    .then(instanceIds => {
      if (instanceIds.length > 0) {
        console.log("send notification to " + instanceIds)

        //send notification to instanceIds
        return admin.messaging().sendToDevice(instanceIds, { data: this.makeFullSyncMessageData().toMessagingPayloadJson() }).then(
          response => {
            console.log(response)
            return response.results.map(device => device.messageId)
          }
        ).catch((err) => {
          console.log(err)
          return []
        })
      }
      else {
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
