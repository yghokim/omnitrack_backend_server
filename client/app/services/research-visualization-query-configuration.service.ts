import { Injectable, OnInit, OnDestroy } from "@angular/core";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";
import { Subscription } from "rxjs/Subscription";
import { TrackingDataService } from "./tracking-data.service";
import isEqual from "lodash/isEqual";
import * as moment from "moment-timezone";
import { FormBuilder } from "@angular/forms";

const dayStartArg = { hour: 0, minute: 0, second: 0, millisecond: 0 };

@Injectable()
export class ResearchVisualizationQueryConfigurationService implements OnDestroy {
  private readonly _internalSubscriptions = new Subscription();

  private readonly _scopeSubject = new BehaviorSubject<Scope>(new Scope());

  constructor() {}

  ngOnInit() {}

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe();
  }

  set scope(range: Scope) {
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
    }
  }

  get scopeSubject(): Observable<Scope> {
    return this._scopeSubject.filter(range => range != null);
  }
}

export class Scope {
  isAbsolute: boolean = true;
  rangeLength: number = 3;
  rangeUnit: string = "w";
  offset: number = 0;
  endPivot: number = Date.now();

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