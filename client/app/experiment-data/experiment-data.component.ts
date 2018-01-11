import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { ResearchApiService } from '../services/research-api.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-experiment-data',
  templateUrl: './experiment-data.component.html',
  styleUrls: ['./experiment-data.component.scss']
})
export class ExperimentDataComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()

  private participants: Array<any>

  private selectedParticipantId: string
  
  constructor(
    private api: ResearchApiService,
    private notificationService: NotificationService
  ) { 

  }

  ngOnInit() {
    this.notificationService.registerGlobalBusyTag("participantsInDataComponent")
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.flatMap(service => service.getParticipants())
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
    this._internalSubscriptions.unsubscribe()
  }
  
  onParticipantSelectionChanged(event){
    console.log(event)
  }

  private onSelectedParticipantIdChanged(newParticipantId: string){
    
  }

}
