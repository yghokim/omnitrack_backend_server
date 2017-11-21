import OTTrigger from '../models/ot_trigger'
import OTTracker from '../models/ot_tracker'
import { SyncInfo } from '../modules/push.module'
import PushModule from '../modules/push.module'
import C from '../server_consts'
import app from '../app'
import { Model } from 'mongoose';

export default class CommandModule {

  private setUserChildVariable(model: Model<any>, objectId:string, variableName:string, value: any, syncType: string, validUserId: string = null): Promise<boolean>{
    const where = {_id: objectId}
    if(validUserId != null) where["user"] = validUserId
    const set = {}
    set[variableName] = value    
    return model.findOneAndUpdate(where, {$set: set}, {new: false, select: "_id user " + variableName}).then(old=>{
      if(old!=null)
      {
        const changed = old[variableName] != value
        if(changed)
        {
          console.log("the " + syncType + " variable " + variableName + " was changed.")
          app.pushModule().sendSyncDataMessageToUser(old["user"], [syncType])
        }
        else{
          console.log("inserted the same value. skip.")
        }
        return changed
      }
      else return false
    }).catch(err=>{
      console.log(err)
      return Promise.reject(err)
    })
  }

  attachTrackerToTrigger(triggerId: string, trackerId: string, validUserId: string = null): Promise<boolean> {
    return OTTrigger.findById(triggerId, "user trackers").then(trigger => {

      if(trigger == null)
      {
        return Promise.reject("No such trigger - " + triggerId)
      }

      if (validUserId != null) {
        if (trigger["user"] != validUserId) {
          console.log("user id was not matched.")
          return Promise.reject("userId not matched")
        }
      }

      if (trigger["trackers"].includes(trackerId)) {
        console.log("tracker is already attached to the trigger " + triggerId)
        return false
      }
      else {
        return OTTracker.findById(trackerId, "user").then(tracker => {
          if (tracker["user"] == trigger["user"]) {
            trigger["trackers"].push(tracker._id)
            trigger["userUpdatedAt"] = Date.now()
            console.log("attached tracker to trigger.")
            return trigger.save().then(doc => {
              app.serverModule().registerSynchronizationPush(trigger["user"], new SyncInfo([{type: C.SYNC_TYPE_TRIGGER}]))
              return true
            })
          }
          else return false
        })
      }
    })
  }
  
  setTriggerSwitch(triggerId: string, isOn: boolean, validUserId: string = null): Promise<boolean>{
    return this.setUserChildVariable(OTTrigger, triggerId, "isOn", isOn, C.SYNC_TYPE_TRIGGER, validUserId)
  }
  
  setTriggerVariable(triggerId: string, variableName: string, value: any, validUserId: string = null): Promise<boolean>{
    return this.setUserChildVariable(OTTrigger, triggerId, variableName, value, C.SYNC_TYPE_TRIGGER, validUserId)
  }

  setTrackerVariable(trackerId: string, variableName: string, value: any, validUserId: string = null): Promise<boolean>{
    return this.setUserChildVariable(OTTracker, trackerId, variableName, value, C.SYNC_TYPE_TRACKER, validUserId)
  }

  removeUserChild(model: Model<any>, objectId:string, syncType: string, permanent: boolean = false, validUserId: string = null): Promise<boolean>{
    if(permanent == true)
    {
      const where = {_id: objectId}
      if(validUserId != null) where["user"] = validUserId  
      return model.findOneAndRemove(where, {select: "user"}).then(
        removed=>
        {
          console.log(removed)
          if(removed != null)
          {
            app.pushModule().sendSyncDataMessageToUser(removed["user"], [syncType]).then(
              result=>{
             
              }
            ).catch(err=>{
              console.log(err)
            })
          }

          return removed != null
        })
    }
    else{
      return this.setTriggerVariable(objectId, "removed", true, validUserId)
    }
  }

  removeTracker(trackerId, permanent: boolean = false, validUserId: string = null): Promise<boolean>{
    return this.removeUserChild(OTTracker, trackerId, C.SYNC_TYPE_TRACKER, permanent, validUserId)
  }
  
  removeTrigger(triggerId, permanent: boolean = false, validUserId: string = null): Promise<boolean>{
    return this.removeUserChild(OTTrigger, triggerId, C.SYNC_TYPE_TRIGGER, permanent, validUserId)
  }
  
}
