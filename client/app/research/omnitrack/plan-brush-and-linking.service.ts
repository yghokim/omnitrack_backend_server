import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { ITrackerDbEntity, ITriggerDbEntity, IFieldDbEntity } from "../../../../omnitrack/core/db-entity-types";
import { map } from "rxjs/operators";

export enum BrushAndLinkingObjectType {
  Tracker, Field, Trigger
}

export interface BrushAndLinkingEvent {
  objectType: BrushAndLinkingObjectType,
  obj: any,
  source: string
}

@Injectable()
export class PlanBrushAndLinkingService {

  private readonly currentHoveringObjectSubject = new BehaviorSubject<BrushAndLinkingEvent>(null)

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
          if (event.objectType === BrushAndLinkingObjectType.Field && event.obj.trackerId === trackerId) {
            return event.obj._id
          } else return null
        } else return null
      })
    )
  }

  onHoverTrigger(trigger: ITriggerDbEntity, source: string) {
    this.currentHoveringObjectSubject.next({ obj: trigger, objectType: BrushAndLinkingObjectType.Trigger, source: source })
  }

  onHoverTracker(tracker: ITrackerDbEntity, source: string) {
    this.currentHoveringObjectSubject.next({
      obj: tracker,
      objectType: BrushAndLinkingObjectType.Tracker,
      source: source
    })
  }

  onHoverField(field: IFieldDbEntity, source: string) {
    this.currentHoveringObjectSubject.next({
      obj: field,
      objectType: BrushAndLinkingObjectType.Field,
      source: source
    })
  }

  onLeaveObject() {
    this.currentHoveringObjectSubject.next(null)
  }
}
