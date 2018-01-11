import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { ResearchApiService } from '../services/research-api.service';
import { NotificationService } from '../services/notification.service';
import { ITrackerDbEntity, IItemDbEntity } from '../../../omnitrack/core/db-entity-types';

@Component({
  selector: 'app-experiment-data',
  templateUrl: './experiment-data.component.html',
  styleUrls: ['./experiment-data.component.scss']
})
export class ExperimentDataComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  private userSubscriptions = new Subscription()

  private participants: Array<any>

  private selectedParticipantId: string
  private selectedTrackerId: string

  private userTrackers: Array<ITrackerDbEntity> = []
  private userItems: Array<IItemDbEntity> = []
  
  constructor(
    private api: ResearchApiService,
    private notificationService: NotificationService
  ) { 

  }

  ngOnInit() {
    this.notificationService.registerGlobalBusyTag("participantsInDataComponent")
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.do(service => {
        service.trackingDataService.registerConsumer("experimentDataComponent")
      }).flatMap(service => service.getParticipants())
        .subscribe(participants => {
          this.participants = participants
          if(this.participants.length > 0)
          {
            this.selectedParticipantId = this.participants[0]._id
            this.onSelectedParticipantIdChanged(this.selectedParticipantId)
          }
          this.notificationService.unregisterGlobalBusyTag("participantsInDataComponent")
        })
    )
  }

  ngOnDestroy(): void {
    if(this.api.selectedExperimentServiceSync)
    {
      this.api.selectedExperimentServiceSync.trackingDataService.unregisterConsumer("experimentDataComponent")
    }
    this._internalSubscriptions.unsubscribe()
    this.userSubscriptions.unsubscribe()
  }
  
  onParticipantSelectionChanged(event){
    console.log(event)
  }

  onTrackerTabChanged(event){
    this.selectedTrackerId = this.userTrackers[event.index]._id
    this.onSelectedTrackerIdChanged(this.selectedTrackerId)
  }

  private onSelectedParticipantIdChanged(newParticipantId: string){
    console.log("set to " + newParticipantId)
    const userId = this.participants.find(p => p._id == newParticipantId ).user._id
    this.userSubscriptions.unsubscribe()
    this.userSubscriptions = new Subscription()
    this.userSubscriptions.add(
      this.api.selectedExperimentService.flatMap(service=>service.trackingDataService.getTrackersOfUser(userId)).subscribe(
        trackers => {
          console.log("user's trackers")
          console.log(trackers)
          this.userTrackers = trackers
        }
      )
    )
    
    this.userSubscriptions.add(
      this.api.selectedExperimentService.flatMap(service=>service.trackingDataService.getItemsOfUser(userId)).subscribe(
        items => {
          this.userItems = items
        }
      )
    )
  }

  private onSelectedTrackerIdChanged(newTrackerId: string){
    
  }

}