import IdGenerator from "./id_generator";
import * as fs from "fs-extra";
import { OmniTrackFlagGraph, DependencyLevel } from "./functionality-locks/omnitrack-dependency-graph";
import { ITrackerDbEntity, ITriggerDbEntity } from "./db-entity-types";
import { TriggerConstants } from "./trigger-constants";

const randomstring  = require('randomstring');
/**
 * Contains the anonymised tracker and trigger package that are portable and injectable to any users.
 */
export default class PredefinedPackage {
  static readonly PLACEHOLDER_PREFIX = "%{"
  static readonly PLACEHOLDER_SUFFIX = "}%"

  static generateNewInjectionId(currentPool: Array<string>):string{
    let newId: string
    do{
      newId = randomstring.generate(8); 
    }while(currentPool.indexOf(newId) >= 0)
    currentPool.push(newId)
    return newId
  }



  appLevelFlags: any = {}

  trackers: Array<ITrackerDbEntity> = []
  triggers: Array<ITriggerDbEntity> = []
  serviceCodes: Array<string> = []

  placeHolderDict: {
    user: string,
    trackers: Array<string>,
    triggers: Array<string>,
    attributes: Array<{ id: string, localId: string }>
  } = { user: null, trackers: [], triggers: [], attributes: [] }

  /**
   *
   * @param trackers trackers in a client format
   * @param triggers triggers in a client format
   */
  constructor(trackers: Array<ITrackerDbEntity>, triggers: Array<ITriggerDbEntity>) {

    this.appLevelFlags = OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.App)
    this.trackers = trackers
    this.triggers = triggers

    this.trackers.forEach(tracker => {
      tracker.lockedProperties = OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.Tracker)
      tracker.attributes.forEach(attribute => {
        attribute.lockedProperties = OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.Field)
      })
    })

    this.triggers.forEach(trigger => {
      if(trigger.actionType === TriggerConstants.ACTION_TYPE_REMIND){
        trigger.lockedProperties = OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.Reminder)
      }else{
        trigger.lockedProperties = OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.Trigger)
      }
    })

    this.refresh()
  }

  /**
   * Writes the package into Json file.
   * @param path JSON file path to write
   */
  write(path: string): Promise<void> {
    return fs.outputJson(path, {
      trackers: this.trackers,
      triggers: this.triggers,
      serviceCodes: this.serviceCodes
    }, { spaces: 2 })
  }

  /**
   * Anonymise current data again.
   */
  refresh() {
    // first, clear removed ones
    for (let i = this.trackers.length - 1; i >= 0; --i) {
      if (this.trackers[i].removed === true) {
        this.trackers.splice(i, 1)
      } else {
        for (let j = this.trackers[i].attributes.length - 1; j >= 0; --j) {
          const attr = this.trackers[i].attributes[j]
          if (attr.isInTrashcan === true) {
            this.trackers[i].attributes.splice(j, 1)
          }
        }
      }
    }

    for (let i = this.triggers.length - 1; i >= 0; --i) {
      if (this.triggers[i].removed === true) {
        this.triggers.splice(i, 1)
      }
    }

    //Injection ids to avoid duplicate id.
    const generatedInjectionIds = []

    const trackerIdTable = {}
    let trackerCount = 0
    const triggerIdTable = {}
    let triggerCount = 0
    const attributeIdTable = {}
    let attributeCount = 0
    const attributeLocalIdTable = {}

    this.placeHolderDict = { user: null, trackers: [], triggers: [], attributes: [] }
    this.placeHolderDict.user = this.generatePlaceholder("owner")

    // anonymise trackers and attributes
    this.trackers.forEach(tracker => {
      if(!tracker.flags)
      {
        tracker.flags = {injected: true}
      }
      tracker.flags.injectionId = PredefinedPackage.generateNewInjectionId(generatedInjectionIds)

      tracker.user = this.placeHolderDict.user
      const trackerPlaceHolder = this.generatePlaceholder("tracker", trackerCount)
      trackerCount++

      this.placeHolderDict.trackers.push(trackerPlaceHolder)
      trackerIdTable[tracker._id] = trackerPlaceHolder
      tracker._id = trackerPlaceHolder
      tracker.attributes.forEach(attribute => {
        if(!attribute.flags)
      {
        attribute.flags = {injected: true}
      }
      attribute.flags.injectionId = PredefinedPackage.generateNewInjectionId(generatedInjectionIds)

        const attrPlaceHolder = this.generatePlaceholder("attribute", attributeCount)
        const attrLocalIdPlaceHolder = this.generatePlaceholder("attribute_local", attributeCount)
        this.placeHolderDict.attributes.push({ id: attrPlaceHolder, localId: attrLocalIdPlaceHolder })
        attributeIdTable[attribute._id] = attrPlaceHolder
        attributeLocalIdTable[attribute.localId] = attrLocalIdPlaceHolder
        attributeCount++

        attribute._id = attrPlaceHolder
        attribute.localId = attrLocalIdPlaceHolder
        attribute.trackerId = trackerIdTable[attribute.trackerId]
      })
    })

    // anonymise triggers and associated trackers and attributes
    this.triggers.forEach(trigger => {
      if(!trigger.flags)
      {
        trigger.flags = {injected: true}
      }
      trigger.flags.injectionId = PredefinedPackage.generateNewInjectionId(generatedInjectionIds)

      const triggerPlaceHolder = this.generatePlaceholder("trigger", triggerCount)
      triggerCount++
      this.placeHolderDict.triggers.push(triggerPlaceHolder)
      triggerIdTable[trigger._id] = triggerPlaceHolder
      trigger._id = triggerPlaceHolder

      trigger.user = this.placeHolderDict.user
      if (trigger.trackers != null) {
        for (let i = 0; i < trigger.trackers.length; i++) {
          trigger.trackers[i] = trackerIdTable[trigger.trackers[i]]
        }
      }

      // condition script
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
    })
  }

  private generatePlaceholder(text: string, index: number = null) {
    return PredefinedPackage.PLACEHOLDER_PREFIX + text.toUpperCase() + "_" + (index || 0) + PredefinedPackage.PLACEHOLDER_SUFFIX
  }

}
