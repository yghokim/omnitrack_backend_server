import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { ITrackerDbEntity, ITriggerDbEntity, IFieldDbEntity, IDescriptionPanelDbEntity } from "../../../../omnitrack/core/db-entity-types";
import { map } from "rxjs/operators";

export enum InteractivePlanObjectType {
  Tracker, Field, DescriptionPanel, Trigger
}

export interface BrushAndLinkingEvent {
  objectType: InteractivePlanObjectType,
  obj: any,
  source: string
}

@Injectable()
export class PlanBrushAndLinkingService {

  private readonly currentHoveringObjectSubject = new BehaviorSubject<BrushAndLinkingEvent>(null)

  readonly objectClickEvent = new Subject<BrushAndLinkingEvent>()

  get currentHoveringInfo(): Observable<BrushAndLinkingEvent> {
    return this.currentHoveringObjectSubject
  }

  get currentHoveringObject(): BrushAndLinkingEvent {
    return this.currentHoveringObjectSubject.getValue()
  }

  checkHoverOnId(id: string): Observable<boolean> {
    return this.currentHoveringInfo.pipe(
      map(event => {
        if (event && event.obj) {
          return event.obj._id === id
        } else return false
      })
    )
  }

  checkHoveringFieldIdOfTracker(trackerId: string): Observable<boolean> {
    return this.currentHoveringInfo.pipe(
      map(event => {
        if (event && event.obj) {
          if (event.objectType === InteractivePlanObjectType.Field && event.obj.trackerId === trackerId) {
            return event.obj._id
          } else return null
        } else return null
      })
    )
  }

  checkHoveringDescriptionPanelIdOfTracker(trackerId: string): Observable<boolean> {
    return this.currentHoveringInfo.pipe(
      map(event => {
        if (event && event.obj) {
          if (event.objectType === InteractivePlanObjectType.DescriptionPanel && event.obj.trackerId === trackerId) {
            return event.obj._id
          } else return null
        } else return null
      })
    )
  }

  onHoverTrigger(trigger: ITriggerDbEntity, source: string) {
    this.currentHoveringObjectSubject.next({ obj: trigger, objectType: InteractivePlanObjectType.Trigger, source: source })
  }

  onActivateTrigger(trigger: ITriggerDbEntity, source: string) {
    this.objectClickEvent.next({
      obj: trigger,
      objectType: InteractivePlanObjectType.Trigger,
      source: source
    })
  }

  onActivateTracker(tracker: ITrackerDbEntity, source: string) {
    this.objectClickEvent.next({
      obj: tracker,
      objectType: InteractivePlanObjectType.Tracker,
      source: source
    })
  }

  onActivateField(field: IFieldDbEntity, source: string) {
    this.objectClickEvent.next({
      obj: field,
      objectType: InteractivePlanObjectType.Field,
      source: source
    })
  }


  onActivateDescriptionPanel(panel: IDescriptionPanelDbEntity, source: string) {
    this.objectClickEvent.next({
      obj: panel,
      objectType: InteractivePlanObjectType.DescriptionPanel,
      source: source
    })
  }

  onHoverTracker(tracker: ITrackerDbEntity, source: string) {
    this.currentHoveringObjectSubject.next({
      obj: tracker,
      objectType: InteractivePlanObjectType.Tracker,
      source: source
    })
  }

  onHoverField(field: IFieldDbEntity, source: string) {
    this.currentHoveringObjectSubject.next({
      obj: field,
      objectType: InteractivePlanObjectType.Field,
      source: source
    })
  }

  onHoverDescriptionPanel(panel: IDescriptionPanelDbEntity, source: string){
    this.currentHoveringObjectSubject.next({
      obj: panel,
      objectType: InteractivePlanObjectType.DescriptionPanel,
      source: source
    })
  }

  onLeaveObject() {
    this.currentHoveringObjectSubject.next(null)
  }
}
