import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { ITrackerDbEntity, ITriggerDbEntity } from "../../../../omnitrack/core/db-entity-types";

export enum BrushAndLinkingObjectType{
  Tracker, Field, Trigger
}

export interface BrushAndLinkingEvent{
  objectType: BrushAndLinkingObjectType,
  obj: any,
  source: string
}

@Injectable()
export class PlanBrushAndLinkingService {

  private readonly currentHoveringObjectSubject = new BehaviorSubject<BrushAndLinkingEvent>(null)

  get currentHoveringInfo(): Observable<BrushAndLinkingEvent>{
    return this.currentHoveringObjectSubject
  }

  get currentHoveringObject(): BrushAndLinkingEvent{
    return this.currentHoveringObjectSubject.getValue()
  }

  onHoverTrigger(trigger: ITriggerDbEntity, source: string){
    this.currentHoveringObjectSubject.next({obj: trigger, objectType: BrushAndLinkingObjectType.Trigger, source: source})
  }

  onLeaveObject(){
    this.currentHoveringObjectSubject.next(null)
  }
}