import { Component, OnInit, OnDestroy } from "@angular/core";
import { VisualizationBaseComponent } from "../visualization-base.component";
import { ResearchVisualizationQueryConfigurationService, Scope } from "../../../services/research-visualization-query-configuration.service";
import { Subscription } from "rxjs/Subscription";
import { Observable } from 'rxjs/Observable';
import "rxjs/operator/combineLatest";
import { TrackingDataService } from '../../../services/tracking-data.service';
import { ResearchApiService } from "../../../services/research-api.service";

@Component({
  selector: "app-engagement",
  templateUrl: "./engagement.component.html",
  styleUrls: ["./engagement.component.scss"]
})
export class EngagementComponent extends VisualizationBaseComponent<
  EngagementData
> implements OnInit, OnDestroy {
  isBusy = true;

  private readonly _internalSubscriptions = new Subscription();

  constructor(
    private queryConfigService: ResearchVisualizationQueryConfigurationService,
    private api: ResearchApiService
  ) {
    super();
  }

  ngOnInit() {


    this._internalSubscriptions.add(
      this.makeScopeAndParticipantsObservable().flatMap(project => {
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

            return {participantId: participant._id, alias: participant.alias, trackingDataList: trackers.filter(tracker=>tracker.user === participant.user._id).map(tracker=>{
              return {trackerName: tracker.name, trackerId: tracker._id, items: items.filter(item=>item.tracker === tracker._id).map(item=>{
                return {timestamp: new Date(item.timestamp), dateIndex: 0}
              })}
            })}
          })
        })
      }).subscribe(data=>{
        console.log(data)
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

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe();
  }
}

type EngagementData = Array<{participantId: string, alias: string, trackingDataList: [
  {
    trackerName: string,
    trackerId: string,
    items: [{timestamp: Date, dateIndex: number}]
  }
  ]}>
