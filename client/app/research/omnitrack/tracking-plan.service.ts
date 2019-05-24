import { Injectable } from '@angular/core';
import { ITrackerDbEntity, ITriggerDbEntity, IAttributeDbEntity } from '../../../../omnitrack/core/db-entity-types';
import { TriggerConstants } from '../../../../omnitrack/core/trigger-constants';

export interface TrackingPlanData {
  appLevelFlags: any,
  trackers: Array<ITrackerDbEntity>,
  triggers: Array<ITriggerDbEntity>
}

@Injectable()
export class TrackingPlanService {

  currentPlan: TrackingPlanData

  constructor() { }


  filterLoggingTriggers(): Array<ITriggerDbEntity> {
    if (this.currentPlan != null) {
      return this.currentPlan.triggers.filter(t => t.actionType === TriggerConstants.ACTION_TYPE_LOG)
    } else return null
  }

  getRemindersOf(tracker: ITrackerDbEntity): Array<ITriggerDbEntity> {
    console.log(this.currentPlan.triggers)
    return this.currentPlan.triggers.filter(t => t.actionType === TriggerConstants.ACTION_TYPE_REMIND && t.trackers.indexOf(tracker._id) !== -1)
  }

  getTrackerOfReminder(trigger: ITriggerDbEntity): ITrackerDbEntity{
    const trackerId = trigger.trackers[0]
    return this.getTracker(trackerId)
  }

  getTrackerOfField(field: IAttributeDbEntity): ITrackerDbEntity{
    return this.getTracker(field.trackerId)
  }

  getTracker(id: string): ITrackerDbEntity {
    if (this.currentPlan != null) {
      return this.currentPlan.trackers.find(t => t._id === id)
    } else return null
  }
}
