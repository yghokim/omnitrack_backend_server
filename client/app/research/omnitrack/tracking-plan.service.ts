import { Injectable } from '@angular/core';
import { ITrackerDbEntity, ITriggerDbEntity, IAttributeDbEntity } from '../../../../omnitrack/core/db-entity-types';
import { TrackingPlanManagerImpl } from '../../../../omnitrack/core/tracking-plan-helper';
import { TrackingPlan } from '../../../../omnitrack/core/tracking-plan';
import { DependencyLevel, OmniTrackFlagGraph } from '../../../../omnitrack/core/functionality-locks/omnitrack-dependency-graph';

@Injectable()
export class TrackingPlanService {

  public set currentPlan(plan: TrackingPlan) {
    this.currentImpl = new TrackingPlanManagerImpl(plan)
  }

  public get currentPlan(): TrackingPlan{
    return this.currentImpl.currentPlan
  }

  private currentImpl: TrackingPlanManagerImpl

  constructor() {
  }

  generateFlagGraph(level: DependencyLevel, model: any): OmniTrackFlagGraph {
    return this.currentImpl.generateFlagGraph(level, model)
  }

  filterLoggingTriggers(): Array<ITriggerDbEntity> {
    return this.currentImpl.filterLoggingTriggers()
  }

  getRemindersOf(tracker: ITrackerDbEntity): Array<ITriggerDbEntity> {
    return this.currentImpl.getRemindersOf(tracker)
  }

  getTrackerOfReminder(trigger: ITriggerDbEntity): ITrackerDbEntity {
    return this.currentImpl.getTrackerOfReminder(trigger)
  }

  getTrackerOfField(field: IAttributeDbEntity): ITrackerDbEntity {
    return this.currentImpl.getTrackerOfField(field)
  }

  getTracker(id: string): ITrackerDbEntity {
    return this.currentImpl.getTracker(id)
  }
}
