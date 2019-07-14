import { Injectable } from '@angular/core';
import { ITrackerDbEntity, ITriggerDbEntity, IFieldDbEntity } from '../../../../omnitrack/core/db-entity-types';
import { TrackingPlanManagerImpl } from '../../../../omnitrack/core/tracking-plan-helper';
import { TrackingPlan } from '../../../../omnitrack/core/tracking-plan';
import { DependencyLevel, OmniTrackFlagGraph } from '../../../../omnitrack/core/functionality-locks/omnitrack-dependency-graph';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TrackingPlanService {

  public readonly onNewPlanSet = new Subject<TrackingPlan>()

  public readonly navigationTree = new BehaviorSubject<Array<{ id: string, entityType: string }>>([])

  isIdSelectedInNav(id: string): Observable<boolean> {
    return this.navigationTree.pipe(map(
      navList => {
        return navList.find(n => n.id === id) != null
      }
    ))
  }

  getSelectedEntityIdWithType(type: string): Observable<string> {
    return this.navigationTree.pipe(
      map(
        navList => {
          const entity = navList.find(n => n.entityType === type)
          if (entity) {
            return entity.id
          } else return null
        }
      )
    )
  }

  isIdSelectedInNavSync(id: string): boolean {
    if (this.navigationTree.value) {
      return this.navigationTree.value.find(n => n.id === id) != null
    } else return false
  }

  public set currentPlan(plan: TrackingPlan) {
    this.currentImpl = new TrackingPlanManagerImpl(plan)
    this.onNewPlanSet.next(plan)
  }

  public get currentPlan(): TrackingPlan {
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

  getTrackerOfField(field: IFieldDbEntity): ITrackerDbEntity {
    return this.currentImpl.getTrackerOfField(field)
  }

  getTracker(id: string): ITrackerDbEntity {
    return this.currentImpl.getTracker(id)
  }

  getField(id: string): IFieldDbEntity {
    for (let tracker of this.currentPlan.trackers) {
      if (tracker.fields) {
        for (let field of tracker.fields) {
          if(field._id === id){
            return field
          }
        }
      } else continue
    }
    return null
  }

  getTrigger(id: string): ITriggerDbEntity {
    return this.currentImpl.currentPlan.triggers.find(t => t._id === id)
  }

  selectTracker(tracker: ITrackerDbEntity) {
    this.navigationTree.next([
      {
        id: tracker._id,
        entityType: 'tracker'
      }
    ])
  }
  selectLoggingTrigger(trigger: ITriggerDbEntity) {
    this.navigationTree.next([
      {
        id: trigger._id,
        entityType: 'trigger'
      }
    ])
  }

  selectField(field: IFieldDbEntity) {
    this.navigationTree.next([
      {
        id: field.trackerId,
        entityType: 'tracker'
      },
      {
        id: field._id,
        entityType: 'field'
      }
    ])
  }

  selectReminder(reminder: ITriggerDbEntity) {
    this.navigationTree.next([
      {
        id: reminder.trackers[0],
        entityType: 'tracker'
      },
      {
        id: reminder._id,
        entityType: 'reminder'
      }
    ])
  }

  unselectElement(id: string) {
    if (this.navigationTree.value) {
      const currentTree = this.navigationTree.value.slice()
      const elementIndex = currentTree.findIndex(t => t.id === id)
      if (elementIndex !== -1) {
        //has
        currentTree.splice(elementIndex)
        this.navigationTree.next(currentTree)
      }
    }
  }

  unselectAll() {
    this.navigationTree.next([])
  }


}
