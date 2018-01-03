import OTTrigger from '../models/ot_trigger'
import OTTracker from '../models/ot_tracker'
import OTUser from '../models/ot_user'
import AttributeManager from '../../omnitrack/core/attributes/attribute.manager'
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

  setAttributePropertySerializedValue(trackerFilter: any, attributeFilter: any,  propertyKey: string, newSerializedValue: string, validUserId: string = null ): Promise<boolean> {
    // const where = {_id: trackerId, "attributes.localId": attributeLocalId, "attributes.properties.key": propertyKey }
    if (validUserId != null) { trackerFilter["user"] = validUserId }
    return OTTracker.aggregate([
      {$match: trackerFilter},
      {$unwind: "$attributes"},
      {$match: attributeFilter},
      {$project: {_id: 1, user: 1,  attrId: "$attributes._id", attrType: "$attributes.type", attrLocalId: "$attributes.localId", properties: "$attributes.properties" }}])
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
                filter: {_id: row._id, "attributes.localId": row.attrLocalId},
                update: { $set: {
                  "attributes.$.properties": row.properties,
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
              filter: {_id: row._id, "attributes.localId": row.attrLocalId},
              update: {
                $push: {"attributes.$.properties": {key: propertyKey, sVal: newSerializedValue}},
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

  getAttributeType(trackerId: string, attributeLocalId: string, validUserId?: string): Promise<number> {
    const trackerFilter = {_id: trackerId}
    if (validUserId) {
      trackerFilter["user"] = validUserId
    }

    return OTTracker.aggregate([
      {$match: trackerFilter},
      {$unwind: "$attributes"},
      {$match: {"attributes.localId": attributeLocalId}},
      {$project: {type: "$attributes.type"}}
    ]).then(result => {
      if (result.length > 0) {
         return result[0]["type"]
      } else { return null }
    })
  }

  setAttributePropertyRawValue(args: {trackerId?: string, attributeLocalId?: string, attributeType?: number, propertyKey: string, newValue: any, validUserId?: string}): Promise<boolean> {

    let attributeTypePromise: Promise<number>
    if (args.attributeType) {
      // when we already know the type
      attributeTypePromise = Promise.resolve(args.attributeType)
    } else {
      if (args.attributeLocalId == null || args.trackerId == null) {
        throw new Error("If attribute type is not specified, both attributeLocalId and trackerId must be specified.")
      } else {
        attributeTypePromise = this.getAttributeType(args.trackerId, args.attributeLocalId, args.validUserId)
      }
    }

    return attributeTypePromise.then(type => {
      const where = {"attributes.type": type, "attributes.properties.key": args.propertyKey }
      if (args.trackerId) {
        where["_id"] = args.trackerId
      }
      if (args.attributeLocalId) {
        where["attributes.localId"] = args.attributeLocalId
      }
      const serialized = AttributeManager.getHelper(type).getPropertyHelper(args.propertyKey).serializePropertyValue(args.newValue)
      console.log("put serialized property value : " + serialized)
      return this.setAttributePropertySerializedValue(where, args.propertyKey, serialized, args.validUserId)
    })
  }


  getAttributePropertyValue(trackerId: string, attributeLocalId: string, propertyKey: string, validUserId: string = null): Promise<any> {
    const where = {_id: trackerId, "attributes.localId": attributeLocalId, "attributes.properties.key": propertyKey }
    if (validUserId != null) { where["user"] = validUserId }

    return OTTracker.aggregate(
      [
        {$match: {_id: trackerId}},
        {$unwind: "$attributes"},
        {$match: {"attributes.localId": attributeLocalId}},
        {$unwind: "$attributes.properties"},
        {$match: {"attributes.properties.key": propertyKey}},
        {$project: {type: "$attributes.type", serialized: "$attributes.properties.sVal"}}
      ]).then(result => {
        if (result.length > 0) {
          const serialized = result[0]["serialized"]
          if (serialized) {
            return AttributeManager.getHelper(result[0]["type"]).getPropertyHelper(propertyKey).deserializePropertyValue(serialized)
          } else { return null }
        } else { return null }
      })
  }


}
