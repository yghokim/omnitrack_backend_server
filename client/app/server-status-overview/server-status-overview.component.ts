import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { Subscription } from 'rxjs';
import * as moment from 'moment';

@Component({
  selector: 'app-server-status-overview',
  templateUrl: './server-status-overview.component.html',
  styleUrls: ['./server-status-overview.component.scss']
})
export class ServerStatusOverviewComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  constructor(private api: ResearchApiService) {
    
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.queryUsageLogsAnonymized({name: "session"}, moment().subtract(2, 'month').toISOString(), moment().toISOString()).subscribe(
        list=>{
          console.log(list)
        }
      )
    )
  }

  ngOnDestroy(){
    this._internalSubscriptions.unsubscribe()
  }

}
