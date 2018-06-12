import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import { logsToEngagements } from '../../../shared_lib/engagement';
import { EngagementDataService } from '../experiment-overview/client-usage/engagement-data.service';
import { HighChartsHelper } from '../shared-visualization/highcharts-helper';

@Component({
  selector: 'app-server-status-overview',
  templateUrl: './server-status-overview.component.html',
  styleUrls: ['./server-status-overview.component.scss']
})
export class ServerStatusOverviewComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()
  private engagements: Array<any>
  public chart

  constructor(private api: ResearchApiService, public engagementService: EngagementDataService) {
    
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.queryUsageLogsAnonymized({name: "session"}, moment().subtract(2, 'month').toISOString(), moment().toISOString()).subscribe(
        list=>{
          console.log(list)
          this.engagements = logsToEngagements(list)
          this.engagementService.setEngageLog(this.engagements, null, true, [])
          console.log(this.engagements)
          const chartOptions = HighChartsHelper.makeDefaultChartOptions('line', "40%")
          chartOptions.tooltip = {
            shared: true,
            valueDecimals: 2
          } 

        }
      )
    )
  }

  ngOnDestroy(){
    this._internalSubscriptions.unsubscribe()
  }

}
