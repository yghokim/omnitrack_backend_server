import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from "@angular/core";
import { VisualizationBaseComponent } from "../visualization-base.component";
import { ResearchVisualizationQueryConfigurationService, Scope } from "../../../services/research-visualization-query-configuration.service";
import { Subscription } from "rxjs/Subscription";
import { Observable } from 'rxjs/Observable';
import "rxjs/operator/combineLatest";
import { TrackingDataService } from '../../../services/tracking-data.service';
import { ResearchApiService } from "../../../services/research-api.service";
import { NO_ERRORS_SCHEMA } from '@angular/core';
import * as d3 from 'd3';
import { Subject } from "rxjs/Subject";
import { D3VisualizationBaseComponent } from "../d3-visualization-base.component";

@Component({
  selector: "app-engagement",
  templateUrl: "./engagement.component.html",
  styleUrls: ["./engagement.component.scss"]
})
export class EngagementComponent extends D3VisualizationBaseComponent<
  EngagementData
> implements OnInit, OnDestroy {
  isBusy = true;

  readonly X_AXIS_HEIGHT = 50
  readonly Y_AXIS_WIDTH = 120

  readonly PARTICIPANT_MINIMUM_HEIGHT = 50
  readonly TRACKER_ROW_HEIGHT = 50

  private readonly _internalSubscriptions = new Subscription();

  private readonly visualizationWidth = new Subject<number>();

  private visualizationAreaHeight = 100


  @ViewChild("xAxisGroup") xAxisGroup: ElementRef
  @ViewChild("yAxisGroup") yAxisGroup: ElementRef
  @ViewChild("chartMainGroup") chartMainGroup: ElementRef



  constructor(
    private queryConfigService: ResearchVisualizationQueryConfigurationService,
    private api: ResearchApiService
  ) {
    super();
  }

  ngOnInit() {

    //init visualization


    this._internalSubscriptions.add(
      this.makeDataObservable().do(data=>{
        this.data = data
        this.isBusy = false
      }).combineLatest(this.visualizationWidth, (data, width)=>{
        return {data: data, width: width}
      }).subscribe(project=>{
        const numTrackers = project.data.map(p=>p.trackingDataList.length).reduce((a,b)=>{return a+b})
        const numZeroTrackerParticipants = project.data.filter(p=>p.trackingDataList.length === 0).length
        this.visualizationAreaHeight = numTrackers * this.TRACKER_ROW_HEIGHT + numZeroTrackerParticipants * this.PARTICIPANT_MINIMUM_HEIGHT + this.X_AXIS_HEIGHT
      })
    );

  }

  private makeScopeAndParticipantsObservable(): Observable<{trackingDataService: TrackingDataService, scope: Scope, participants: Array<any>}>{
    return this.api.selectedExperimentService.map(service=>service.trackingDataService)
      .combineLatest(this.queryConfigService.scopeSubject,
        this.api.selectedExperimentService.flatMap(service=>service.getParticipants()), (service, scope, participants) => {
        return {trackingDataService: service, scope: scope, participants: participants}
      }
    )
  }

  private makeDataObservable(): Observable<EngagementData>{
    return this.makeScopeAndParticipantsObservable().flatMap(project => {
      const userIds = project.participants.map(p=>p.user._id)
      return project.trackingDataService.getTrackersOfUser(userIds)
      .combineLatest(project.trackingDataService.getItemsOfUser(userIds), (trackers, items) => {
        //make data
        let earliestExperimentStart: number = null
        return project.participants.map(participant => {
          const experimentRangeStart = participant.experimentRange.from
          if(!earliestExperimentStart) earliestExperimentStart = experimentRangeStart
          else{
            earliestExperimentStart = Math.min(earliestExperimentStart, experimentRangeStart)
          }

          return {participantId: participant._id.toString(), alias: participant.alias.toString(), trackingDataList: trackers.filter(tracker=>tracker.user === participant.user._id).map(tracker=>{
            return {trackerName: tracker.name.toString(), trackerId: tracker._id.toString(), items: items.filter(item=>item.tracker === tracker._id).map(item=>{
              return {timestamp: new Date(item.timestamp), dateIndex: 0}
            })}
          })}
        })
      })
    })
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe();
  }
}

type EngagementData = Array<{participantId: string, alias: string, trackingDataList: Array<
  {
    trackerName: string,
    trackerId: string,
    items: Array<{timestamp: Date, dateIndex: number}>
  }>}>
