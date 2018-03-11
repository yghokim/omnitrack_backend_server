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
import { ITrackerDbEntity, IItemDbEntity } from "../../../omnitrack/core/db-entity-types";

const dayStartArg = { hour: 0, minute: 0, second: 0, millisecond: 0 };

@Injectable()
export class ResearchVisualizationQueryConfigurationService implements OnDestroy {
  private readonly _internalSubscriptions = new Subscription();

  private readonly _scopeSubject = new BehaviorSubject<Scope>(new Scope());

  private readonly _dayIndexRangeSubject = new BehaviorSubject<DayIndexRange>({ from: 0, to: 1 })

  private readonly _queriedDataset = new BehaviorSubject<FilteredExperimentDataset>(null)

  constructor(
    private api: ResearchApiService
  ) {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.flatMap(service => service.getParticipants()).subscribe(
        participants => {
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

            this._dayIndexRangeSubject.next(
              { from: 0, to: numDays - 1 }
            )
          }
        }
      )
    )

    this._internalSubscriptions.add(
      this.makeScopeAndParticipantsObservable().flatMap(project => {
        const userIds = project.participants.map(p => p.user._id)
        return project.trackingDataService.getTrackersOfUser(userIds)
          .combineLatest(project.trackingDataService.getItemsOfUser(userIds), (trackers, items) => {
            //make data
            const today = moment().startOf("day")
            let earliestExperimentStart: number = null
            const data = project.participants.map(participant => {
              const experimentRangeStart = new Date(participant.experimentRange.from).getTime()
              if (!earliestExperimentStart) earliestExperimentStart = experimentRangeStart
              else {
                earliestExperimentStart = Math.min(earliestExperimentStart, experimentRangeStart)
              }

              const startDate = moment(participant.experimentRange.from).startOf("day")
              const numDays = diffDaysBetweenTwoMoments(today, startDate, project.scope.includeWeekends) + 1

              const trackingDataList = trackers.filter(tracker => tracker.user === participant.user._id).map(tracker => {
                const decodedItems = items.filter(item => {
                  if (item.tracker === tracker._id) {
                    if (project.scope.includeWeekends) {
                      return true
                    }
                    else {
                      const dow = moment(item.timestamp).isoWeekday()
                      return dow !== 6 && dow !== 7
                    }
                  }
                  return false
                }).map(item => {
                  const timestampMoment = moment(item.timestamp)
                  const day = diffDaysBetweenTwoMoments(timestampMoment, startDate, project.scope.includeWeekends)
                  const dayRatio = timestampMoment.diff(moment(timestampMoment).startOf("day"), "days", true)
                  return { day: day, dayRatio: dayRatio, item: item }
                })
                return { tracker: tracker, decodedItems: decodedItems }
              })
              return {participant: participant, numDays: numDays, trackingData: trackingDataList}
            })
            return {earliestExperimentStart: earliestExperimentStart, includesWeekends: project.scope.includeWeekends, data: data}
          })
      }).subscribe((dataset: FilteredExperimentDataset) => {
        this._queriedDataset.next(dataset)
      })

    )

  }


  ngOnDestroy() {
    if (this.api.selectedExperimentServiceSync) {
      this.api.selectedExperimentServiceSync.trackingDataService.unregisterConsumer("queryConfigService")
    }
    this._internalSubscriptions.unsubscribe();
  }

  get scope(): Scope {
    return this._scopeSubject.value
  }

  get filteredDateset(): FilteredExperimentDataset{
    return this._queriedDataset.value
  }

  get filteredDatesetSubject(): Observable<FilteredExperimentDataset>{
    return this._queriedDataset.filter(dataset=> dataset != null)
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
    return this._dayIndexRangeSubject.map(range => [range.from, range.to])
  }

  setDayIndexRange(range: Array<number>) {
    this._dayIndexRangeSubject.next({ from: range[0], to: range[1] })
  }

  get scopeSubject(): Observable<Scope> {
    return this._scopeSubject.filter(range => range != null);
  }

  public makeScopeAndParticipantsObservable(): Observable<{ trackingDataService: TrackingDataService, scope: Scope, participants: Array<any> }> {
    return this.api.selectedExperimentService.map(service => service.trackingDataService).do(service => {
      service.registerConsumer("queryConfigService")
    })
      .combineLatest(this.scopeSubject,
        this.api.selectedExperimentService.flatMap(service => service.getParticipants()), (service, scope, participants) => {
          return { trackingDataService: service, scope: scope, participants: participants }
        }
      )
  }
}

export type DayIndexRange = {
  from: number,
  to: number
}

export class Scope {
  isAbsolute: boolean = false;
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

export interface FilteredExperimentDataset {
  earliestExperimentStart: number,
  includesWeekends: boolean,
  data: Array<{
    participant: any,
    numDays: number,
    trackingData: Array<{
      tracker: ITrackerDbEntity,
      decodedItems: Array<{
        day: number,
        dayRatio: number,
        item: IItemDbEntity
      }>
    }>
  }>
}