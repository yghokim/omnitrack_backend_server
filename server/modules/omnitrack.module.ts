import { Express } from 'express';
import * as Agenda from 'agenda';
import {ModelConverter} from '../../omnitrack/core/model_converter'
import ServerModule from './server.module';
import CommandModule from './command.module';
import PushModule from './push.module';
import FirstUserPolicyModule from './first.user.policy.module';
import PredefinedPackage from '../../omnitrack/core/predefined_package'
import OTTracker from '../models/ot_tracker'
import OTTrigger from '../models/ot_trigger'
import IdGenerator from '../../omnitrack/core/id_generator'
import C from '../server_consts'
import ResearchModule from './research.module';

export default class OmniTrackModule{

  public readonly serverModule: ServerModule
  public readonly firstUserPolicyModule: FirstUserPolicyModule
  public readonly commandModule: CommandModule
  public readonly pushModule: PushModule
  public readonly researchModule: ResearchModule

  constructor(private app: any){
    this.serverModule = new ServerModule()
    this.firstUserPolicyModule = new FirstUserPolicyModule()
    this.commandModule = new CommandModule()
    this.pushModule = new PushModule()
    this.researchModule = new ResearchModule()
  }

  bootstrap(){
    this.serverModule.bootstrap()
  }

  /**
   * Extracts predefined package from the trackers
   * @param userId user object id
   * @param trackerIds tracker object ids
   */
  extractPackage(userId: string, trackerIds: Array<string>): Promise<PredefinedPackage>{
    const trackers: Array<any> = []
    return OTTracker.find().where('_id').in(trackerIds).then(result=>{
      if(result.length > 0)
      {
        trackers.push(result)
        return OTTrigger.find().where('trackers').in(result.map(t=>t._id)).then(triggers=>{
          
        })
      }
      else{
        return Promise.resolve(null)
      }
    })
  }

  injectPackage(userId: string, predefinedPackage: PredefinedPackage): Promise<void>{
    return new Promise((resolve, reject)=>{
      const pack: PredefinedPackage = JSON.parse(JSON.stringify(predefinedPackage))
      const deviceLocalId = -1
      var currentNanoStamp = 0
      const trackerIdTable= {}
      const attributeIdTable = {}
      const attributeLocalIdTable = {}
      const triggerIdTable = {}
  
      pack.placeHolderDict.trackers.forEach(trackerPlaceHolder=>{
        trackerIdTable[trackerPlaceHolder] = IdGenerator.generateObjectId()
      })
      pack.placeHolderDict.triggers.forEach(triggerPlaceHolder=>{
        triggerIdTable[triggerPlaceHolder] = IdGenerator.generateObjectId()
      })
      pack.placeHolderDict.attributes.forEach(attrPlaceHolder=>{
        attributeIdTable[attrPlaceHolder.id] = IdGenerator.generateObjectId()
        attributeLocalIdTable[attrPlaceHolder.localId] = IdGenerator.generateAttributeLocalId(deviceLocalId, Date.now(), (++currentNanoStamp)%1000)
      })
      
      pack.trackers.forEach(tracker=>{
        tracker.userCreatedAt = Date.now()
        tracker.user = userId
        tracker.objectId = trackerIdTable[tracker.objectId]
        tracker.attributes.forEach(attr=>{
          attr.objectId = attributeIdTable[attr.objectId]
          attr.localId = attributeLocalIdTable[attr.localId]
          attr.trackerId = tracker.objectId
  
          //TODO deal with connection
          attr.userCreatedAt = Date.now()
          attr.userUpdatedAt = Date.now()
        })
        tracker.userUpdatedAt = Date.now()
        tracker.createdAt = new Date()
        tracker.updatedAt = tracker.createdAt
      })
  
      pack.triggers.forEach(trigger=>{
        trigger.userCreatedAt = Date.now()
        trigger.user = userId
        trigger.objectId = triggerIdTable[trigger.objectId]
        for(let i =0; i < trigger.trackers.length; i++)
        {
          trigger.trackers[i] = trackerIdTable[trigger.trackers[i]]
        }
  
        if(trigger.script!=null)
        {
          for(let id in trackerIdTable)
          {
            trigger.script = trigger.script.replace(id, trackerIdTable[id])
          }
          for(let id in triggerIdTable)
          {
            trigger.script = trigger.script.replace(id, triggerIdTable[id])
          }
          for(let id in attributeIdTable)
          {
            trigger.script = trigger.script.replace(id, attributeIdTable[id])
          }
          for(let id in attributeLocalIdTable)
          {
            trigger.script = trigger.script.replace(id, attributeLocalIdTable[id])
          }
        }

        trigger.userUpdatedAt = Date.now()
        trigger.createdAt = new Date()
        trigger.updatedAt = new Date()
      })
      
      //save them to database
      const promises = []
      const syncTypes = []
      if(pack.trackers.length > 0)
      {
        console.log("inject " + pack.trackers.length + " trackers to user.")
        syncTypes.push(C.SYNC_TYPE_TRACKER)
        promises.push(OTTracker.insertMany(pack.trackers.map(tr => ModelConverter.convertClientToDbFormat(tr))))
      }
      if(pack.triggers.length > 0)
      {
        console.log("inject " + pack.triggers.length + " triggers to user.")
        syncTypes.push(C.SYNC_TYPE_TRIGGER)
        promises.push(OTTrigger.insertMany(pack.triggers.map(tr => ModelConverter.convertClientToDbFormat(tr))))
      }

      Promise.all(promises).then((results)=>{
        console.log("all trackers and triggers was injected to user database.")
        this.serverModule.registerMessageDataPush(userId, this.pushModule.makeSyncMessageFromTypes(syncTypes))
        resolve()
      })
        .catch(err=>{
          console.log(err)
        reject(err)
      })
    })
  }
}
