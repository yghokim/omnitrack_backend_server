import { Injectable, OnInit, OnDestroy } from "@angular/core";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";
import { Subscription } from "rxjs/Subscription";
import { TrackingDataService } from "./tracking-data.service";
import isEqual from "lodash/isEqual";
import * as moment from "moment-timezone";
import { FormBuilder } from "@angular/forms";
import { deepclone, diffDaysBetweenTwoMoments } from "../../../shared_lib/utils";
import { ResearchApiService } from "./research-api.service";

const dayStartArg = { hour: 0, minute: 0, second: 0, millisecond: 0 };

@Injectable()
export class ResearchVisualizationQueryConfigurationService implements OnDestroy {
  private readonly _internalSubscriptions = new Subscription();

  private readonly _scopeSubject = new BehaviorSubject<Scope>(new Scope());


  constructor(
    private api: ResearchApiService
  ) {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.flatMap(service => service.getParticipants()).subscribe(
        participants => {
          console.log("participants were loaded.")
          let earliestExperimentStart: number = null

          participants.forEach(participant => {
            const experimentRangeStart = new Date(participant.experimentRange.from).getTime()
            if (!earliestExperimentStart) earliestExperimentStart = experimentRangeStart
            else {
              earliestExperimentStart = Math.min(earliestExperimentStart, experimentRangeStart)
            }
          })

          if (earliestExperimentStart != null) {
            const today = moment().endOf("day")
            const numDays = diffDaysBetweenTwoMoments(today, moment(earliestExperimentStart).startOf("day"), this.scope.includeWeekends) + 1

            const scope = this._scopeSubject.getValue()
            scope.dayIndexRange = [0, numDays - 1]
            console.log("send new scope:")
            console.log(scope)
            this.scope = scope
          }
        }
      )
    )
   }


  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe();
  }

  get scope(): Scope {
    return this._scopeSubject.value
  }

  set scope(range: Scope) {
    /*
    if (this._scopeSubject.value) {
      // value exists
      if (range) {
        if (isEqual(this._scopeSubject.value, range) === false) {
          this._scopeSubject.next(range);
        }
      } else {
        this._scopeSubject.next(range);
      }
    } else {
      if (range) {
        this._scopeSubject.next(range);
      }
    }*/
    this._scopeSubject.next(range);
  }

  setIncludeWeekends(includeWeekends: boolean) {
    this.scope.includeWeekends = includeWeekends
    this._scopeSubject.next(this.scope)
  }

  includeWeekends(): Observable<boolean> {
    return this._scopeSubject.map(scope => scope.includeWeekends)
  }

  dayIndexRange(): Observable<Array<number>> {
    return this._scopeSubject.map(scope => scope.dayIndexRange)
  }

  setDayIndexRange(range: Array<number>) {
    this.scope.dayIndexRange = range
    this._scopeSubject.next(this.scope)
  }

  get scopeSubject(): Observable<Scope> {
    return this._scopeSubject.filter(range => range != null);
  }
}

export class Scope {
  isAbsolute: boolean = false;
  dayIndexRange: Array<number> = [0, 1]
  rangeLength: number = 3;
  rangeUnit: string = "w";
  offset: number = 0;
  endPivot: number = Date.now();
  includeWeekends: boolean = false

  getRange(
    participant?: any,
    earliestPivot?: number
  ): { from: number; to: number } {
    const end = moment(this.endPivot)
      .set(dayStartArg)
      .add(1, "d");
    if (this.isAbsolute !== true) {
      //relative. check experimentRange
      const experimentRangeStart = moment(participant.experimentRange.from).set(
        dayStartArg
      );
      const earliest = moment(earliestPivot).set(dayStartArg);
      end.add(experimentRangeStart.valueOf() - earliest.valueOf(), "ms");
    }

    end.subtract((this.rangeLength * this.offset) as any, this.rangeUnit);
    const start = moment(end);
    start.subtract(this.rangeLength as any, this.rangeUnit);
    return { from: start.valueOf(), to: end.valueOf() };
  }
}
