import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../../services/research-api.service';
import { ResearchVisualizationQueryConfigurationService } from '../../services/research-visualization-query-configuration.service';
import { query } from '@angular/animations';
import { Subscription } from 'rxjs/Subscription';
import { Chart } from 'angular-highcharts';
import { HighChartsHelper } from '../../shared-visualization/highcharts-helper';

@Component({
  selector: 'app-client-usage',
  templateUrl: './client-usage.component.html',
  styleUrls: ['./client-usage.component.scss']
})
export class ClientUsageComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()
  public usageLog: Array<any>;
  public chart

  constructor(private queryConfigService: ResearchVisualizationQueryConfigurationService,
    private api: ResearchApiService) {
   }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.queryConfigService.makeScopeAndParticipantsObservable(true).combineLatest(this.api.selectedExperimentService, (result, expService)=> ({participantsAndScope: result, expService: expService}))
      .flatMap(result =>
        result.expService.queryUsageLogsPerParticipant(null, result.participantsAndScope.participants.map(p=>p.user._id))
      ).subscribe(usageLogQueryResult=>{
        console.log(usageLogQueryResult)
        this.usageLog = usageLogQueryResult;
      })
    )
    
    
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

}
