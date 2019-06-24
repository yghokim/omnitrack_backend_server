import OTTrigger from '../models/ot_trigger'
import OTTracker from '../models/ot_tracker'
import OTUser from '../models/ot_user'
import FieldManager from '../../omnitrack/core/fields/field.manager'
import { SyncInfo } from '../modules/push.module'
import PushModule from '../modules/push.module'
import C from '../server_consts'
import app from '../app'
import { Model } from 'mongoose';

export default class CommandModule {

  private setUserChildVariable(model: Model<any>, objectId: string, variableName: string, value: any, syncType: string, validUserId: string = null): Promise<boolean> {
    const where = {_id: objectId}
    if (validUserId != null) { where["user"] = validUserId }
    const set = {}
    set[variableName] = value
    return model.findOneAndUpdate(where, {$set: set}, {new: false, select: "_id user " + variableName}).then(old => {
      if (old != null) {
        const changed = old[variableName] !== value
        if (changed) {
          console.log("the " + syncType + " variable " + variableName + " was changed.")
          app.serverModule().registerMessageDataPush(old["user"], app.pushModule().makeSyncMessageFromTypes([syncType]))
        } else {
          console.log("inserted the same value. skip.")
        }
        return changed
      } else { return false }
    }).catch(err => {
      console.log(err)
      return Promise.reject(err)
    })
  }

  attachTrackerToTrigger(triggerId: string, trackerId: string, validUserId: string = null): Promise<boolean> {
    return OTTrigger.findById(triggerId, "user trackers").then(trigger => {

      if (trigger == null) {
        return Promise.reject("No such trigger - " + triggerId)
      }

      if (validUserId != null) {
        if (trigger["user"] !== validUserId) {
          console.log("user id was not matched.")
          return Promise.reject("userId not matched")
        }
      }

      if (trigger["trackers"].includes(trackerId)) {
        console.log("tracker is already attached to the trigger " + triggerId)
        return false
      } else {
        return OTTracker.findById(trackerId, "user").then(tracker => {
          if (tracker["user"] === trigger["user"]) {
            trigger["trackers"].push(tracker._id)
            trigger["userUpdatedAt"] = Date.now()
            console.log("attached tracker to trigger.")
            return trigger.save().then(doc => {
              app.serverModule().registerMessageDataPush(trigger["user"], app.pushModule().makeSyncMessageFromTypes([C.SYNC_TYPE_TRIGGER]))
              return true
            })
          } else { return false }
        })
      }
    })
  }

  setTriggerSwitch(triggerId: string, isOn: boolean, validUserId: string = null): Promise<boolean> {
    return this.setUserChildVariable(OTTrigger, triggerId, "isOn", isOn, C.SYNC_TYPE_TRIGGER, validUserId)
  }

  setTriggerVariable(triggerId: string, variableName: string, value: any, validUserId: string = null): Promise<boolean> {
    return this.setUserChildVariable(OTTrigger, triggerId, variableName, value, C.SYNC_TYPE_TRIGGER, validUserId)
  }

  setTrackerVariable(trackerId: string, variableName: string, value: any, validUserId: string = null): Promise<boolean> {
    return this.setUserChildVariable(OTTracker, trackerId, variableName, value, C.SYNC_TYPE_TRACKER, validUserId)
  }

  removeUser(userId, removeAllSiblings: boolean= false, removeAllData: boolean = false): Promise<boolean> {
    return OTUser.findOneAndRemove({_id: userId}).then(result => {
      return true
    })
  }

  removeUserChild(model: Model<any>, objectId: string, syncType: string, permanent: boolean = false, validUserId: string = null): Promise<boolean> {
    if (permanent === true) {
      const where = {_id: objectId}
      if (validUserId != null) { where["user"] = validUserId }
      return model.findOneAndRemove(where, {select: "user"}).then(
        removed => {
          console.log(removed)
          if (removed != null) {
            app.serverModule().registerMessageDataPush(removed["user"], app.pushModule().makeSyncMessageFromTypes([syncType]))
          }

          return removed != null
        })
    } else {
      return this.setTriggerVariable(objectId, "removed", true, validUserId)
    }
  }

  removeTracker(trackerId, permanent: boolean = false, validUserId: string = null): Promise<boolean> {
    return this.removeUserChild(OTTracker, trackerId, C.SYNC_TYPE_TRACKER, permanent, validUserId)
  }

  removeTrigger(triggerId, permanent: boolean = false, validUserId: string = null): Promise<boolean> {
    return this.removeUserChild(OTTrigger, triggerId, C.SYNC_TYPE_TRIGGER, permanent, validUserId)
  }

  setFieldPropertySerializedValue(trackerFilter: any, fieldFilter: any,  propertyKey: string, newSerializedValue: string, validUserId: string = null ): Promise<boolean> {
    // const where = {_id: trackerId, "fields.localId": fieldLocalId, "fields.properties.key": propertyKey }
    if (validUserId != null) { trackerFilter["user"] = validUserId }
    return OTTracker.aggregate([
      {$match: trackerFilter},
      {$unwind: "$fields"},
      {$match: fieldFilter},
      {$project: {_id: 1, user: 1,  attrId: "$fields._id", attrType: "$fields.type", fieldLocalId: "$fields.localId", properties: "$fields.properties" }}])
    .then(aggregated => {
      const bulkWriteCommands = []
      const notifiedUsers = []
      aggregated.forEach((row: any) => {
        const matchProperty = row.properties.find(p => p.key === propertyKey)
        if (matchProperty) {
          if (matchProperty.sVal !== newSerializedValue) {
            matchProperty.sVal = newSerializedValue
            bulkWriteCommands.push({
              updateOne: {
                filter: {_id: row._id, "fields.localId": row.fieldLocalId},
                update: { $set: {
                  "fields.$.properties": row.properties,
                  updatedAt: new Date()
                  }
                },
                upsert: false
              }
            })
            notifiedUsers.push(row.user)
          }
        } else {
          bulkWriteCommands.push({
            updateOne: {
              filter: {_id: row._id, "fields.localId": row.fieldLocalId},
              update: {
                $push: {"fields.$.properties": {key: propertyKey, sVal: newSerializedValue}},
                $set: {updatedAt: new Date()}
              },
              upsert: false
            }
          })
          notifiedUsers.push(row.user)
        }
      })
      console.log("aggregation count: " + aggregated.length)
      console.log("bulkWrite command count : " + bulkWriteCommands.length)
      if (bulkWriteCommands.length > 0) {
        return OTTracker.collection.bulkWrite(bulkWriteCommands).then(
          (writeResult: any) => {
            console.log(writeResult.toJSON() )
            writeResult.toJSON().writeErrors.forEach(err => {console.log(err.toJSON())})
            if (writeResult.ok === 1 && writeResult.toJSON().writeErrors.length === 0) {
              const notifiedUsersUnique = notifiedUsers.filter((u, i) => notifiedUsers.indexOf(u) === i)
              console.log("send change notification to:")
              console.log(notifiedUsersUnique)
              app.serverModule().registerMessageDataPush(notifiedUsersUnique, app.pushModule().makeSyncMessageFromTypes([C.SYNC_TYPE_TRACKER]))

              return true
            } else { return false }
          }
        )
      } else {
        return false
      }
    })
  }

  getFieldType(trackerId: string, fieldLocalId: string, validUserId?: string): Promise<number> {
    const trackerFilter = {_id: trackerId}
    if (validUserId) {
      trackerFilter["user"] = validUserId
    }

    return OTTracker.aggregate([
      {$match: trackerFilter},
      {$unwind: "$fields"},
      {$match: {"fields.localId": fieldLocalId}},
      {$project: {type: "$fields.type"}}
    ]).then(result => {
      if (result.length > 0) {
         return result[0]["type"]
      } else { return null }
    })
  }

  setFieldPropertyRawValue(args: {trackerId?: string, fieldLocalId?: string, fieldType?: number, propertyKey: string, newValue: any, validUserId?: string}): Promise<boolean> {

    let fieldTypePromise: Promise<number>
    if (args.fieldType) {
      // when we already know the type
      fieldTypePromise = Promise.resolve(args.fieldType)
    } else {
      if (args.fieldLocalId == null || args.trackerId == null) {
        throw new Error("If field type is not specified, both fieldLocalId and trackerId must be specified.")
      } else {
        fieldTypePromise = this.getFieldType(args.trackerId, args.fieldLocalId, args.validUserId)
      }
    }

    return fieldTypePromise.then(type => {
      const where = {"fields.type": type, "fields.properties.key": args.propertyKey }
      if (args.trackerId) {
        where["_id"] = args.trackerId
      }
      if (args.fieldLocalId) {
        where["fields.localId"] = args.fieldLocalId
      }
      const serialized = FieldManager.getHelper(type).getPropertyHelper(args.propertyKey).serializePropertyValue(args.newValue)
      console.log("put serialized property value : " + serialized)
      return this.setFieldPropertySerializedValue(where, args.propertyKey, serialized, args.validUserId)
    })
  }


  getFieldPropertyValue(trackerId: string, fieldLocalId: string, propertyKey: string, validUserId: string = null): Promise<any> {
    const where = {_id: trackerId, "fields.localId": fieldLocalId, "fields.properties.key": propertyKey }
    if (validUserId != null) { where["user"] = validUserId }

    return OTTracker.aggregate(
      [
        {$match: {_id: trackerId}},
        {$unwind: "$fields"},
        {$match: {"fields.localId": fieldLocalId}},
        {$unwind: "$fields.properties"},
        {$match: {"fields.properties.key": propertyKey}},
        {$project: {type: "$fields.type", serialized: "$fields.properties.sVal"}}
      ]).then(result => {
        if (result.length > 0) {
          const serialized = result[0]["serialized"]
          if (serialized) {
            return FieldManager.getHelper(result[0]["type"]).getPropertyHelper(propertyKey).deserializePropertyValue(serialized)
          } else { return null }
        } else { return null }
      })
  }


}
