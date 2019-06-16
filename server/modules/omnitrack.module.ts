import * as fs from 'fs-extra';
import * as path from 'path';
import { ModelConverter } from '../../omnitrack/core/model_converter'
import ServerModule from './server.module';
import CommandModule from './command.module';
import PushModule from './push.module';
import PredefinedPackage from '../../omnitrack/core/tracking-plan'
import OTTracker from '../models/ot_tracker'
import OTTrigger from '../models/ot_trigger'
import IdGenerator from '../../omnitrack/core/id_generator'
import C from '../server_consts';
import { merge } from '../../shared_lib/utils';
import SocketModule from './socket.module';
import { TrackingPlanManagerImpl } from '../../omnitrack/core/tracking-plan-helper';
import { DependencyLevel } from '../../omnitrack/core/functionality-locks/omnitrack-dependency-graph';
import { TriggerConstants } from '../../omnitrack/core/trigger/trigger-constants';

export default class OmniTrackModule {

  public readonly serverModule: ServerModule
  public readonly commandModule: CommandModule
  public readonly pushModule: PushModule
  public readonly socketModule: SocketModule

  constructor(app: any) {
    this.serverModule = new ServerModule()
    this.commandModule = new CommandModule()
    this.pushModule = new PushModule()
    this.socketModule = new SocketModule(app.get("io"))
  }

  bootstrap() {
    this.serverModule.bootstrap()
    this.socketModule.bootstrap()
  }

  injectFirstUserExamples(userId: string): Promise<void> {
    return fs.readJson(path.resolve(__dirname, "../../../../omnitrack/examples/example_trackers.json")).then(
      pack => {
        return this.injectPackage(userId, pack, { tag: "example" })
      }
    )
  }

  injectPackage(userId: string, predefinedPackage: PredefinedPackage, creationFlags?: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const pack: PredefinedPackage = JSON.parse(JSON.stringify(predefinedPackage))

      const planManager = new TrackingPlanManagerImpl(pack)

      pack.trackers.forEach(tracker => {
        tracker.attributes.forEach(attr => {
          attr.lockedProperties = planManager.generateFlagGraph(DependencyLevel.Field, attr).getCascadedFlagObject(DependencyLevel.Field)
        })

        //bake locked properties
        tracker.lockedProperties = planManager.generateFlagGraph(DependencyLevel.Tracker, tracker).getCascadedFlagObject(DependencyLevel.Tracker)
      })

      pack.triggers.forEach(trigger => {
        if (trigger.actionType === TriggerConstants.ACTION_TYPE_REMIND) {
          //reminder
          trigger.lockedProperties = planManager.generateFlagGraph(DependencyLevel.Reminder, trigger).getCascadedFlagObject(DependencyLevel.Reminder)
        } else {
          //logging
          trigger.lockedProperties = planManager.generateFlagGraph(DependencyLevel.Trigger, trigger).getCascadedFlagObject(DependencyLevel.Trigger)
        }
      })


      const deviceLocalId = -1
      let currentNanoStamp = 0
      const trackerIdTable = {}
      const attributeIdTable = {}
      const attributeLocalIdTable = {}
      const triggerIdTable = {}

      const currentDate = new Date()

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
        tracker.userCreatedAt = currentDate.getTime()
        tracker.user = userId
        tracker._id = trackerIdTable[tracker._id]
        tracker.attributes.forEach(attr => {
          attr.flags = merge(attr.flags, creationFlags, true)
          attr._id = attributeIdTable[attr._id]
          attr.localId = attributeLocalIdTable[attr.localId]
          attr.trackerId = tracker._id

          // TODO deal with connection
          attr.userCreatedAt = currentDate.getTime()
          attr.userUpdatedAt = currentDate.getTime()
        })
        tracker.userUpdatedAt = currentDate.getTime()
        tracker.createdAt = currentDate
        tracker.updatedAt = tracker.createdAt
      })

      pack.triggers.forEach(trigger => {
        trigger.flags = merge(trigger.flags, creationFlags, true)
        trigger.userCreatedAt = currentDate.getTime()
        trigger.user = userId
        trigger._id = triggerIdTable[trigger._id]
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

        trigger.userUpdatedAt = currentDate.getTime()
        trigger.createdAt = currentDate
        trigger.updatedAt = currentDate
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
