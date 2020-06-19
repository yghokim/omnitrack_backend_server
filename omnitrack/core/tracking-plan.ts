import { OmniTrackFlagGraph, DependencyLevel } from './functionality-locks/omnitrack-dependency-graph';
import { ITrackerDbEntity, ITriggerDbEntity, IFieldDbEntity } from './db-entity-types';
import { TriggerConstants } from "./trigger/trigger-constants";
import { TRACKER_COLOR_PALETTE } from "./design/palette";
import * as color from 'color';
import FieldManager from "./fields/field.manager";
import { TimeCondition, DataDrivenCondition } from './trigger/trigger-condition';
import { LoggingTriggerAction, ReminderTriggerAction } from './trigger/trigger-action';
import * as deepEqual from 'deep-equal';
import { deepclone } from '../../shared_lib/utils';
import { DEFAULT_VALUE_POLICY_NULL } from './fields/fallback-policies';

const randomstring = require('random-string');
/**
 * Contains the anonymised tracker and trigger package that are portable and injectable to any users.
 */
export class TrackingPlan {

  static isEqual(a: TrackingPlan, b: TrackingPlan): boolean {
    return deepEqual(a.toJson(), b.toJson())
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
      tracker.fields.forEach(field => {
        field.lockedProperties = OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.Field)
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
        if (tracker.fields) {
          tracker.fields.forEach(attr => {
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
    plan.app = json.app || { lockedProperties: null }
    plan.trackers = json.trackers || []
    plan.triggers = json.triggers || []
    plan.serviceCodes = json.serviceCodes || []

    return plan
  }

  static migrate(plan: TrackingPlan) {

    plan.trackers.forEach(t => {
      if (t.layout == null) {
        //if no layout, migrate to new version
        t.layout = t.fields.map(f => ({ type: 'field', reference: f.localId }))
      }
    })
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
        for (let j = this.trackers[i].fields.length - 1; j >= 0; --j) {
          const attr = this.trackers[i].fields[j]
          if (attr.isInTrashcan === true) {
            this.trackers[i].fields.splice(j, 1)
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
    const fieldIdTable = {}
    let fieldCount = 0
    const fieldLocalIdTable = {}

    // anonymise trackers and fields
    this.trackers.forEach(tracker => {
      if (!tracker.flags) {
        tracker.flags = { injected: true }
      }
      tracker.flags.injectionId = TrackingPlan.generateNewInjectionId(generatedInjectionIds)

      tracker.user = null
      const trackerPlaceHolder = this.generatePlaceholder("tracker", tracker.flags.injectionId)
      trackerCount++

      trackerIdTable[tracker._id] = trackerPlaceHolder
      tracker._id = trackerPlaceHolder
      tracker.fields.forEach(field => {
        if (!field.flags) {
          field.flags = { injected: true }
        }
        field.flags.injectionId = TrackingPlan.generateNewInjectionId(generatedInjectionIds)

        const fieldPlaceHolder = this.generatePlaceholder("field", field.flags.injectionId)
        const fieldLocalIdPlaceHolder = this.generatePlaceholder("field_local", field.flags.injectionId)
        fieldIdTable[field._id] = fieldPlaceHolder
        fieldLocalIdTable[field.localId] = fieldLocalIdPlaceHolder
        fieldCount++

        field._id = fieldPlaceHolder
        field.localId = fieldLocalIdPlaceHolder
        field.trackerId = trackerIdTable[field.trackerId]
      })
    })

    // anonymise triggers and associated trackers and fields
    this.triggers.forEach(trigger => {
      if (!trigger.flags) {
        trigger.flags = { injected: true }
      }
      trigger.flags.injectionId = TrackingPlan.generateNewInjectionId(generatedInjectionIds)

      const triggerPlaceHolder = this.generatePlaceholder("trigger", trigger.flags.injectionId)
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
        for (const id in fieldIdTable) {
          if (fieldIdTable.hasOwnProperty(id)) {
            trigger.script = trigger.script.replace(id, fieldIdTable[id])
          }
        }
        for (const id in fieldLocalIdTable) {
          if (fieldLocalIdTable.hasOwnProperty(id)) {
            trigger.script = trigger.script.replace(id, fieldLocalIdTable[id])
          }
        }
      }
    })
  }

  public appendNewTracker(name: string = "New tracker"): ITrackerDbEntity {
    const injectionId = TrackingPlan.generateNewInjectionId(this.injectedIds)
    const id = this.generatePlaceholder("tracker", injectionId)
    const tracker = {
      _id: id,
      name: name,
      position: this.trackers.length,
      fields: new Array(),
      user: null,
      color: color(TRACKER_COLOR_PALETTE[this.trackers.length % TRACKER_COLOR_PALETTE.length]).rgbNumber() + 0xff000000,
      remove: false,
      flags: {
        injected: true,
        injectionId: injectionId
      },
      lockedProperties: OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.Tracker)
    } as ITrackerDbEntity

    this.trackers.push(tracker)

    return tracker
  }

  public removeTracker(tracker: ITrackerDbEntity): boolean {
    const trackerIndex = this.trackers.findIndex(t => t._id === tracker._id)
    if (trackerIndex !== -1) {
      this.trackers.splice(trackerIndex, 1)
      const triggers = this.triggers.slice(0)
      triggers.forEach(trigger => {
        const trackerIndexInTrigger = trigger.trackers.indexOf(tracker._id)
        if (trackerIndexInTrigger !== -1) {
          if (trigger.actionType === TriggerConstants.ACTION_TYPE_REMIND) {
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

  public appendNewField(tracker: ITrackerDbEntity, type: number, name: string = "New Field"): IFieldDbEntity {
    const injectionId = TrackingPlan.generateNewInjectionId(this.injectedIds)
    const fieldPlaceHolder = this.generatePlaceholder("field", injectionId)
    const fieldLocalIdPlaceHolder = this.generatePlaceholder("field_local", injectionId)

    const field = {
      _id: fieldPlaceHolder,
      localId: fieldLocalIdPlaceHolder,
      name: name,
      required: false,
      trackerId: tracker._id,
      type: type,
      fallbackPolicy: DEFAULT_VALUE_POLICY_NULL,
      flags: {
        injected: true,
        injectionId: injectionId
      },
      lockedProperties: OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.Field)
    } as IFieldDbEntity

    FieldManager.getHelper(type).initialize(field)

    if (!tracker.fields) {
      tracker.fields = []
    }
    tracker.fields.push(field)

    if (!tracker.layout) {
      tracker.layout = []
    }

    tracker.layout.push({
      type: 'field',
      reference: field.localId
    })

    return field
  }

  public removeField(field: IFieldDbEntity): boolean {
    const tracker = this.trackers.find(t => t._id === field.trackerId)
    if (tracker != null) {
      const fieldIndex = tracker.fields.findIndex(f => f._id === field._id)
      if (fieldIndex !== -1) {
        tracker.fields.splice(fieldIndex, 1)
        this.injectedIdsCache = null

        if (tracker.layout) {
          const layoutIndex = tracker.layout.findIndex(l => l.reference === field.localId)
          if (layoutIndex !== -1) {
            tracker.layout.splice(layoutIndex, 1)
          }
        }

        return true
      } else { return false }
    } else { return false }
  }

  public appendNewTrigger(actionType: number, conditionType: number): ITriggerDbEntity {
    const injectionId = TrackingPlan.generateNewInjectionId(this.injectedIds)
    const id = this.generatePlaceholder("trigger", TrackingPlan.generateNewInjectionId(this.injectedIds))
    const trigger = {
      _id: id,
      conditionType: conditionType,
      actionType: actionType,
      isOn: true,
      flags: {
        injected: true,
        injectionId: injectionId
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

  public getTrackerById(id: string): ITrackerDbEntity {
    if (this.trackers && this.trackers.length > 0) {
      return this.trackers.find(t => t._id === id)
    } else return null
  }

  private generatePlaceholder(text: string, injectedId: string) {
    return TrackingPlan.PLACEHOLDER_PREFIX + text.toUpperCase() + "_" + injectedId + TrackingPlan.PLACEHOLDER_SUFFIX
  }

  public toJson(): any {
    return {
      app: deepclone(this.app),
      triggers: deepclone(this.triggers),
      trackers: deepclone(this.trackers),
      serviceCodes: this.serviceCodes
    }
  }
}
