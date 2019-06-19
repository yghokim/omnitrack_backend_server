import { OmniTrackFlagGraph, DependencyLevel } from './functionality-locks/omnitrack-dependency-graph';
import { ITrackerDbEntity, ITriggerDbEntity, IAttributeDbEntity } from './db-entity-types';
import { TriggerConstants } from "./trigger/trigger-constants";
import { TRACKER_COLOR_PALETTE } from "./design/palette";
import * as color from 'color';
import AttributeManager from "./attributes/attribute.manager";
import { TimeCondition, DataDrivenCondition } from './trigger/trigger-condition';
import { LoggingTriggerAction, ReminderTriggerAction } from './trigger/trigger-action';
import * as deepEqual from 'deep-equal';

const randomstring = require('random-string');
/**
 * Contains the anonymised tracker and trigger package that are portable and injectable to any users.
 */
export class TrackingPlan {

  static isEqual(a: TrackingPlan, b: TrackingPlan): boolean{
    return deepEqual({
      app: a.app,
      trackers: a.trackers,
      triggers: a.triggers,
      serviceCodes: a.serviceCodes,
    }, {
      app: b.app,
      trackers: b.trackers,
      triggers: b.triggers,
      serviceCodes: b.serviceCodes
    })
  }

  /**
   *
   * @param trackers trackers in a client format
   * @param triggers triggers in a client format
   */
  constructor(trackers: Array<ITrackerDbEntity>, triggers: Array<ITriggerDbEntity>) {

    this.app = { lockedProperties: OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.App) }
    this.trackers = trackers
    this.triggers = triggers

    this.trackers.forEach(tracker => {
      tracker.lockedProperties = OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.Tracker)
      tracker.attributes.forEach(attribute => {
        attribute.lockedProperties = OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.Field)
      })
    })

    this.triggers.forEach(trigger => {
      if (trigger.actionType === TriggerConstants.ACTION_TYPE_REMIND) {
        trigger.lockedProperties = OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.Reminder)
      } else {
        trigger.lockedProperties = OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.Trigger)
      }
    })

    this.refresh()
  }
  static readonly PLACEHOLDER_PREFIX = "%{"
  static readonly PLACEHOLDER_SUFFIX = "}%"


  private injectedIdsCache: Array<string> = null
  private get injectedIds(): Array<string> {
    if (this.injectedIdsCache == null) {
      this.injectedIdsCache = []
      this.trackers.forEach(tracker => {
        if (tracker.flags) {
          this.injectedIdsCache.push(tracker.flags.injectedId)
        }
        if (tracker.attributes) {
          tracker.attributes.forEach(attr => {
            if (attr.flags) {
              this.injectedIdsCache.push(attr.flags.injectedId)
            }
          })
        }
      })

      this.triggers.forEach(trigger => {
        if (trigger.flags) {
          this.injectedIdsCache.push(trigger.flags.injectedId)
        }
      })
    }

    return this.injectedIdsCache
  }

  app: { lockedProperties: any } = { lockedProperties: null }

  trackers: Array<ITrackerDbEntity> = []
  triggers: Array<ITriggerDbEntity> = []
  serviceCodes: Array<string> = []

  static fromJson(json: any): TrackingPlan {
    const plan = new TrackingPlan([], [])
    plan.trackers = json.trackers || []
    plan.triggers = json.triggers || []
    plan.serviceCodes = json.serviceCodes || []
    return plan
  }

  static generateNewInjectionId(currentPool: Array<string>): string {
    let newId: string
    do {
      newId = randomstring({ length: 8 });
    } while (currentPool.indexOf(newId) >= 0)
    currentPool.push(newId)
    return newId
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

    // Injection ids to avoid duplicate id.
    const generatedInjectionIds = []

    const trackerIdTable = {}
    let trackerCount = 0
    const triggerIdTable = {}
    let triggerCount = 0
    const attributeIdTable = {}
    let attributeCount = 0
    const attributeLocalIdTable = {}

    // anonymise trackers and attributes
    this.trackers.forEach(tracker => {
      if (!tracker.flags) {
        tracker.flags = { injected: true }
      }
      tracker.flags.injectionId = TrackingPlan.generateNewInjectionId(generatedInjectionIds)

      tracker.user = null
      const trackerPlaceHolder = this.generatePlaceholder("tracker", trackerCount)
      trackerCount++

      trackerIdTable[tracker._id] = trackerPlaceHolder
      tracker._id = trackerPlaceHolder
      tracker.attributes.forEach(attribute => {
        if (!attribute.flags) {
          attribute.flags = { injected: true }
        }
        attribute.flags.injectionId = TrackingPlan.generateNewInjectionId(generatedInjectionIds)

        const attrPlaceHolder = this.generatePlaceholder("attribute", attributeCount)
        const attrLocalIdPlaceHolder = this.generatePlaceholder("attribute_local", attributeCount)
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
      if (!trigger.flags) {
        trigger.flags = { injected: true }
      }
      trigger.flags.injectionId = TrackingPlan.generateNewInjectionId(generatedInjectionIds)

      const triggerPlaceHolder = this.generatePlaceholder("trigger", triggerCount)
      triggerCount++
      triggerIdTable[trigger._id] = triggerPlaceHolder
      trigger._id = triggerPlaceHolder

      trigger.user = null
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

  public appendNewTracker(name: string = "New tracker"): ITrackerDbEntity {
    const id = this.generatePlaceholder("tracker", this.trackers.length)
    const tracker = {
      _id: id,
      name: name,
      attributes: new Array(),
      user: null,
      color: color(TRACKER_COLOR_PALETTE[this.trackers.length % TRACKER_COLOR_PALETTE.length]).rgbNumber() + 0xff000000,
      remove: false,
      flags: {
        injected: true,
        injectionId: TrackingPlan.generateNewInjectionId(
          this.injectedIds
        )
      },
      lockedProperties: OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.Tracker)
    } as ITrackerDbEntity

    console.log(tracker)

    this.trackers.push(tracker)

    return tracker
  }

  public removeTracker(tracker: ITrackerDbEntity): boolean {
    const trackerIndex = this.trackers.findIndex(t => t._id === tracker._id)
    if (trackerIndex !== -1) {
      this.trackers.splice(trackerIndex, 1)
      const triggers = this.triggers.splice(0)
      triggers.forEach(trigger => {
        const trackerIndexInTrigger = trigger.trackers.indexOf(tracker._id)
        if (trackerIndexInTrigger !== -1) {
          if(trigger.actionType === TriggerConstants.ACTION_TYPE_REMIND){
            //reminder
            this.removeTrigger(trigger)
          }
          else trigger.trackers.splice(trackerIndexInTrigger, 1)
        }
      })

      this.injectedIdsCache = null

      return true
    } else { return false }
  }

  public appendNewField(tracker: ITrackerDbEntity, type: number, name: string = "New Field"): IAttributeDbEntity {
    const currentAttributeCount = tracker.attributes ? tracker.attributes.length : 0
    const attrPlaceHolder = this.generatePlaceholder("attribute", currentAttributeCount)
    const attrLocalIdPlaceHolder = this.generatePlaceholder("attribute_local", currentAttributeCount)
    
    const attribute = {
      _id: attrPlaceHolder,
      localId: attrLocalIdPlaceHolder,
      name: name,
      required: false,
      trackerId: tracker._id,
      type: type,
      flags: {
        injected: true,
        injectionId: TrackingPlan.generateNewInjectionId(this.injectedIds)
      },
      lockedProperties: OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.Field)
    } as IAttributeDbEntity

    AttributeManager.getHelper(type).initialize(attribute)
    tracker.attributes.push(attribute)
    return attribute
  }

  public removeField(field: IAttributeDbEntity): boolean {
    const tracker = this.trackers.find(t => t._id === field.trackerId)
    if (tracker != null) {
      const fieldIndex = tracker.attributes.findIndex(f => f._id === field._id)
      if (fieldIndex !== -1) {
        tracker.attributes.splice(fieldIndex, 1)
        this.injectedIdsCache = null

        return true
      } else { return false }
    } else { return false }
  }

  public appendNewTrigger(actionType: number, conditionType: number): ITriggerDbEntity {
    const id = this.generatePlaceholder("trigger", this.triggers.length)
    const trigger = {
      _id: id,
      conditionType: conditionType,
      actionType: actionType,
      flags: {
        injected: true,
        injectionId: TrackingPlan.generateNewInjectionId(this.injectedIds)
      },
      trackers: [],
    } as ITriggerDbEntity

    switch (actionType) {
      case TriggerConstants.ACTION_TYPE_LOG:
        trigger.action = new LoggingTriggerAction()
        trigger.lockedProperties = OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.Trigger)
        break;
      case TriggerConstants.ACTION_TYPE_REMIND:
        trigger.action = new ReminderTriggerAction()
        trigger.lockedProperties = OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.Reminder)
        break;
    }

    switch (conditionType) {
      case TriggerConstants.CONDITION_TYPE_TIME:
        trigger.condition = new TimeCondition()
        break;
      case TriggerConstants.CONDITION_TYPE_DATA:
        trigger.condition = new DataDrivenCondition()
        break;
    }

    this.triggers.push(trigger)

    return trigger
  }

  public removeTrigger(trigger: ITriggerDbEntity): boolean {
    const triggerIndex = this.triggers.findIndex(t => t._id === trigger._id)
    if (triggerIndex !== -1) {
      this.triggers.splice(triggerIndex, 1)
      this.injectedIdsCache = null
      return true
    } else { return false }
  }

  private generatePlaceholder(text: string, index: number = null) {
    return TrackingPlan.PLACEHOLDER_PREFIX + text.toUpperCase() + "_" + (index || 0) + TrackingPlan.PLACEHOLDER_SUFFIX
  }

  public toJson(): any{
    return {
      triggers: this.triggers,
      trackers: this.trackers,
      serviceCodes: this.serviceCodes
    }
  }
}
