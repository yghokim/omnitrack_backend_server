import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../../../services/research-api.service';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { TrackingSet } from '../../../shared-visualization/custom/productivity-dashboard/productivity-dashboard.component';

@Component({
  selector: 'app-per-participant-visualization-dashboard',
  templateUrl: './per-participant-visualization-dashboard.component.html',
  styleUrls: ['./per-participant-visualization-dashboard.component.scss']
})
export class PerParticipantVisualizationDashboardComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()
  private _trackingSetLoadingSubscriptions: Subscription = null
  public participants: Array<any> = [];

  public productivityTrackingSet: TrackingSet

  private _selectedParticipantId: string
  public set selectedParticipantId(participantId: string) {
    if (this._selectedParticipantId !== participantId) {
      this._selectedParticipantId = participantId
      if (participantId != null) {
        const participant = this.participants.find(p => p._id === participantId)
        const userId = participant.user._id
        if (this._trackingSetLoadingSubscriptions) {
          this._trackingSetLoadingSubscriptions.unsubscribe()
        }
        this._trackingSetLoadingSubscriptions = this.api.selectedExperimentService.map(
          expService => expService.trackingDataService
        ).flatMap(dataService => {
          return dataService.getTrackersOfUser(userId).map(trackers => {
            return trackers.find(tracker => tracker.flags.injectionId === "Ab0ksQyh")
          }).filter(tracker => { return tracker !== null }).flatMap(productivityTracker => {
            if (productivityTracker) {
              return dataService.getItemsOfTracker(productivityTracker._id).map(items => {
                return { tracker: productivityTracker, items: items }
              })
            } else {
              return Observable.of(null)
            }
          })
        }).subscribe(
          trackingSet => {
            this.productivityTrackingSet = trackingSet
          }
        )
      }
    }
  }

  public get selectedParticipantId(): string {
    return this._selectedParticipantId
  }

  constructor(private api: ResearchApiService) {
  }

  ngOnInit() {
    this._internalSubscriptions.add(

      this.api.selectedExperimentService.flatMap(service => {
        service.trackingDataService.registerConsumer("PerParticipantVisualizationDashboardComponent")
        return service.getParticipants()
      }).subscribe(
        participants => {
          this.participants = participants
          console.log(participants)
          if (!this.selectedParticipantId && this.participants.length > 0) {
            this.selectedParticipantId = participants[0]._id
          }
        }
      )
    )
  }

  ngOnDestroy() {
    
    if (this.api.selectedExperimentServiceSync) {
      this.api.selectedExperimentServiceSync.trackingDataService.unregisterConsumer(
        "PerParticipantVisualizationDashboardComponent"
      );
    }

    this._internalSubscriptions.unsubscribe()
    if (this._trackingSetLoadingSubscriptions && this._trackingSetLoadingSubscriptions.closed !== true) {
      this._trackingSetLoadingSubscriptions.unsubscribe()
    }
  }

  onNavClicked(delta: number) {
    var index = this.participants.findIndex(v => v._id === this.selectedParticipantId)

    if (this.participants.length > 0) {
      index = (index - delta + this.participants.length) % this.participants.length
      this.selectedParticipantId = this.participants[index]._id
    }
  }


}
