import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { ResearchApiService } from '../services/research-api.service';
import { Subscription } from 'rxjs/Subscription';
import { IResearchMessage } from '../../../omnitrack/core/research/messaging';

@Component({
  selector: 'app-experiment-messaging',
  templateUrl: './experiment-messaging.component.html',
  styleUrls: ['./experiment-messaging.component.scss']
})
export class ExperimentMessagingComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()

  private messageList: Array<IResearchMessage>

  constructor(private api: ResearchApiService, private dialog: MatDialog, private router: Router, private activatedRoute: ActivatedRoute) {
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.flatMap(service=> service.getMessageList()).subscribe(
        messages=>{
          console.log(messages)
          this.messageList = messages
        }
      )
    )
  }

  ngOnDestroy(){
    this._internalSubscriptions.unsubscribe()
  }

  onTabChanged(event) {
    console.log(event.index)
  }

  onNewMessageClicked() {
    this.router.navigate(['./new'], { relativeTo: this.activatedRoute })
  }

}
