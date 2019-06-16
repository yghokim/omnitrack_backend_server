import { ITrackerDbEntity, ITriggerDbEntity, IAttributeDbEntity } from "./db-entity-types";
import { TriggerConstants } from "./trigger/trigger-constants";
import { DependencyLevel, OmniTrackFlagGraph } from "./functionality-locks/omnitrack-dependency-graph";
import { merge, deepclone } from "../../shared_lib/utils";

export interface TrackingPlanData {
  app: {lockedProperties: any},
  trackers: Array<ITrackerDbEntity>,
  triggers: Array<ITriggerDbEntity>
}

export class TrackingPlanManagerImpl {

  constructor(
    public currentPlan: TrackingPlanData
  ) { }

  generateFlagGraph(level: DependencyLevel, model: any): OmniTrackFlagGraph {

    const defaultFlag = OmniTrackFlagGraph.generateFlagWithDefault(level)

    const modelLockedProperties = model? model.lockedProperties : {}

    const originalFlags = merge(defaultFlag, modelLockedProperties ? deepclone(modelLockedProperties) : {}, true, true)

    switch (level) {
      case DependencyLevel.App:
        return OmniTrackFlagGraph.wrapAppFlags(originalFlags)

      case DependencyLevel.Tracker:
        return OmniTrackFlagGraph.wrapTrackerFlags(
          originalFlags,
          this.currentPlan.app? this.currentPlan.app.lockedProperties : null
        )

      case DependencyLevel.Field:
        return OmniTrackFlagGraph.wrapFieldFlags(
          originalFlags,
          this.getTrackerOfField(model).lockedProperties,
          this.currentPlan.app? this.currentPlan.app.lockedProperties : null
        )

      case DependencyLevel.Trigger:
        return OmniTrackFlagGraph.wrapTriggerFlags(
          originalFlags,
          this.currentPlan.app? this.currentPlan.app.lockedProperties : null
        )

      case DependencyLevel.Reminder:
        return OmniTrackFlagGraph.wrapReminderFlags(
          originalFlags,
          this.getTrackerOfReminder(model).lockedProperties,
          this.currentPlan.app? this.currentPlan.app.lockedProperties : null
        )
    }
  }

  filterLoggingTriggers(): Array<ITriggerDbEntity> {
    if (this.currentPlan != null) {
      return this.currentPlan.triggers.filter(t => t.actionType === TriggerConstants.ACTION_TYPE_LOG)
    } else return null
  }

  getRemindersOf(tracker: ITrackerDbEntity): Array<ITriggerDbEntity> {
    return this.currentPlan.triggers.filter(t => t.actionType === TriggerConstants.ACTION_TYPE_REMIND && t.trackers.indexOf(tracker._id) !== -1)
  }

  getTrackerOfReminder(trigger: ITriggerDbEntity): ITrackerDbEntity {
    const trackerId = trigger.trackers[0]
    return this.getTracker(trackerId)
  }

  getTrackerOfField(field: IAttributeDbEntity): ITrackerDbEntity {
    return this.getTracker(field.trackerId)
  }

  getTracker(id: string): ITrackerDbEntity {
    if (this.currentPlan != null) {
      return this.currentPlan.trackers.find(t => t._id === id)
    } else return null
  }
}
