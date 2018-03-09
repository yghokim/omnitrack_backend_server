import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ResearchApiService } from '../../../services/research-api.service';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { TrackingSet } from '../../../shared-visualization/custom/productivity-dashboard/productivity-dashboard.component';
import * as html2canvas from 'html2canvas';
import * as FileSaver from 'file-saver'; 
import * as moment from 'moment-timezone';

@Component({
  selector: 'app-per-participant-visualization-dashboard',
  templateUrl: './per-participant-visualization-dashboard.component.html',
  styleUrls: ['./per-participant-visualization-dashboard.component.scss']
})
export class PerParticipantVisualizationDashboardComponent implements OnInit, OnDestroy {

  public isProcessingImageCapture = false

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
            const productivityTracker = trackers.find(tracker => tracker.flags.injectionId === "Ab0ksQyh")
            const omitLogTracker = trackers.find(tracker => tracker.flags.injectionId === "gGv9WCm3")
            return {productivityTracker: productivityTracker, omitLogTracker: omitLogTracker} 
          }).flatMap(trackers => {
            if(trackers.productivityTracker==null){return Observable.of(null)}
            else return Observable.zip(dataService.getItemsOfTracker(trackers.productivityTracker._id), trackers.omitLogTracker? dataService.getItemsOfTracker(trackers.omitLogTracker._id) : Observable.of([])).map(itemSets => {
                return { tracker: trackers.productivityTracker, items: itemSets[0], omitLogTracker: trackers.omitLogTracker, omitLogs: itemSets[1], overrideStartDate: participant.experimentRange.from } as TrackingSet
              })
          })
        }).subscribe(
          trackingSet => {
            this.productivityTrackingSet = trackingSet
          }
        )
      }
    }
  }

  @ViewChild("dashboard") dashboardRef: ElementRef

  now: Date = new Date()

  public get selectedParticipantId(): string {
    return this._selectedParticipantId
  }

  public get selectedParticipant(): any{
    if(this.participants){
      return this.participants.find(p => p._id === this.selectedParticipantId)
    }
    else return null
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

  downloadToImage(){
    this.isProcessingImageCapture = true
    console.log("try convert the dashboard to canvas...")
    html2canvas(this.dashboardRef.nativeElement, {scale: 1.5} as any).then(
      canvas => {
        this.isProcessingImageCapture = false
        canvas.toBlob(blob=>{
          console.log('image file size: ' + blob.size)
          FileSaver.saveAs(blob, "productivity_report_" + this.selectedParticipant.user.email.split('@')[0] + "_" + moment().format("YYYY-MM-DDThh-mm") + ".png")
        }, 'image/png')
      }
    ).catch(err=>{
      this.isProcessingImageCapture = false
      console.log(err)
    })
  }
}
