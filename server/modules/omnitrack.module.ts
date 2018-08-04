import * as fs from 'fs-extra';
import * as path from 'path';
import { ModelConverter } from '../../omnitrack/core/model_converter'
import ServerModule from './server.module';
import CommandModule from './command.module';
import PushModule from './push.module';
import PredefinedPackage from '../../omnitrack/core/predefined_package'
import OTTracker from '../models/ot_tracker'
import OTTrigger from '../models/ot_trigger'
import IdGenerator from '../../omnitrack/core/id_generator'
import C from '../server_consts'
import ResearchModule from './research.module';
import { merge } from '../../shared_lib/utils';
import SocketModule from './socket.module';

export default class OmniTrackModule {

  public readonly serverModule: ServerModule
  public readonly commandModule: CommandModule
  public readonly pushModule: PushModule
  public readonly researchModule: ResearchModule
  public readonly socketModule: SocketModule

  constructor(private app: any) {
    this.serverModule = new ServerModule()
    this.commandModule = new CommandModule()
    this.pushModule = new PushModule()
    this.researchModule = new ResearchModule()
    this.socketModule = new SocketModule(app.get("io"))
  }

  bootstrap() {
    this.serverModule.bootstrap()
    this.socketModule.bootstrap()
  }

  injectFirstUserExamples(userId: string): Promise<void>{
    return fs.readJson(path.resolve(__dirname, "../../../../omnitrack/examples/example_trackers.json")).then(
      pack => {
        return this.injectPackage(userId, pack, {tag: "example"})
      }
    )
  }

  injectPackage(userId: string, predefinedPackage: PredefinedPackage, creationFlags?: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const pack: PredefinedPackage = JSON.parse(JSON.stringify(predefinedPackage))
      const deviceLocalId = -1
      let currentNanoStamp = 0
      const trackerIdTable = {}
      const attributeIdTable = {}
      const attributeLocalIdTable = {}
      const triggerIdTable = {}

      pack.placeHolderDict.trackers.forEach(trackerPlaceHolder => {
        trackerIdTable[trackerPlaceHolder] = IdGenerator.generateObjectId()
      })
      pack.placeHolderDict.triggers.forEach(triggerPlaceHolder => {
        triggerIdTable[triggerPlaceHolder] = IdGenerator.generateObjectId()
      })
      pack.placeHolderDict.attributes.forEach(attrPlaceHolder => {
        attributeIdTable[attrPlaceHolder.id] = IdGenerator.generateObjectId()
        attributeLocalIdTable[attrPlaceHolder.localId] = IdGenerator.generateAttributeLocalId(deviceLocalId, Date.now(), (++currentNanoStamp) % 1000)
      })

      pack.trackers.forEach(tracker => {
        tracker.flags = merge(tracker.flags, creationFlags, true)
        tracker.userCreatedAt = Date.now()
        tracker.user = userId
        tracker.objectId = trackerIdTable[tracker.objectId]
        tracker.attributes.forEach(attr => {
          attr.flags = merge(attr.flags,  creationFlags, true)
          attr.objectId = attributeIdTable[attr.objectId]
          attr.localId = attributeLocalIdTable[attr.localId]
          attr.trackerId = tracker.objectId

          // TODO deal with connection
          attr.userCreatedAt = Date.now()
          attr.userUpdatedAt = Date.now()
        })
        tracker.userUpdatedAt = Date.now()
        tracker.createdAt = new Date()
        tracker.updatedAt = tracker.createdAt
      })

      pack.triggers.forEach(trigger => {
        trigger.flags = merge(trigger.flags, creationFlags, true)
        trigger.userCreatedAt = Date.now()
        trigger.user = userId
        trigger.objectId = triggerIdTable[trigger.objectId]
        for (let i = 0; i < trigger.trackers.length; i++) {
          trigger.trackers[i] = trackerIdTable[trigger.trackers[i]]
        }

        if (trigger.script != null) {
          for (const id in trackerIdTable) {
            if (trackerIdTable.hasOwnProperty(id)) {
              trigger.script = trigger.script.replace(id, trackerIdTable[id])
            }
          }
          for (const id in triggerIdTable) {
            if (triggerIdTable.hasOwnProperty(id)) {
              trigger.script = trigger.script.replace(id, triggerIdTable[id])
            }
          }
          for (const id in attributeIdTable) {
            if (attributeIdTable.hasOwnProperty(id)) {
              trigger.script = trigger.script.replace(id, attributeIdTable[id])
            }
          }
          for (const id in attributeLocalIdTable) {
            if (attributeLocalIdTable.hasOwnProperty(id)) {
              trigger.script = trigger.script.replace(id, attributeLocalIdTable[id])
            }
          }
        }

        trigger.userUpdatedAt = Date.now()
        trigger.createdAt = new Date()
        trigger.updatedAt = new Date()
      })

      // save them to database
      const promises = []
      const syncTypes = []
      if (pack.trackers.length > 0) {
        console.log("inject " + pack.trackers.length + " trackers to user.")
        syncTypes.push(C.SYNC_TYPE_TRACKER)
        promises.push(OTTracker.insertMany(pack.trackers.map(tr => ModelConverter.convertClientToDbFormat(tr))))
      }
      if (pack.triggers.length > 0) {
        console.log("inject " + pack.triggers.length + " triggers to user.")
        syncTypes.push(C.SYNC_TYPE_TRIGGER)
        promises.push(OTTrigger.insertMany(pack.triggers.map(tr => ModelConverter.convertClientToDbFormat(tr))))
      }

      Promise.all(promises).then((results) => {
        console.log("all trackers and triggers was injected to user database.")
        this.serverModule.registerMessageDataPush(userId, this.pushModule.makeSyncMessageFromTypes(syncTypes))
        resolve()
      })
        .catch(err => {
          console.log(err)
          reject(err)
        })
    })
  }
}
