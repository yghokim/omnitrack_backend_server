import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../../services/research-api.service';
import { ResearchVisualizationQueryConfigurationService } from '../../services/research-visualization-query-configuration.service';
import { query } from '@angular/animations';
import { Subscription } from 'rxjs/Subscription';
import { Chart } from 'angular-highcharts';
import { HighChartsHelper } from '../../shared-visualization/highcharts-helper';
import { IUsageLogDbEntity } from '../../../../omnitrack/core/db-entity-types';
import d3 = require('d3');
import { EngagementDataService } from './engagement-data.service';

@Component({
  selector: 'app-client-usage',
  templateUrl: './client-usage.component.html',
  styleUrls: ['./client-usage.component.scss'],
  providers: [EngagementDataService]
})
export class ClientUsageComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()
  public usageLog: Array<any>;
  public MIN_SESSION_GAP: number = 1000;
  public chart
  private engageLog: Array<EngageData> =[]

  constructor(private queryConfigService: ResearchVisualizationQueryConfigurationService,
    private api: ResearchApiService, public engagementService: EngagementDataService) {
   }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.queryConfigService.makeScopeAndParticipantsObservable(true).combineLatest(this.api.selectedExperimentService, (result, expService)=> ({participantsAndScope: result, expService: expService}))
      .flatMap(result =>
        result.expService.queryUsageLogsPerParticipant(null, result.participantsAndScope.participants.map(p=>p.user._id))
      ).subscribe(usageLogQueryResult=>{
        this.usageLog = usageLogQueryResult;
        var sessionLog = [];
        console.log(usageLogQueryResult)

        //sort again
        for(let entry of this.usageLog){
          entry.logs.sort((n1,n2) => new Date(n2.timestamp).valueOf() - new Date(n1.timestamp).valueOf())
        }
        //filter sessions
        for(let entry of this.usageLog){
          sessionLog.push({user: entry.user, logs: entry.logs.filter(function(x){
            if(x.name === "session" 
            && x.content.session.indexOf('Fragment') < 0 
            && x.content.session.indexOf('SplashScreenActivity') < 0
            && x.content.session.indexOf('AboutActivity') < 0
            && x.content.session.indexOf('SendReportActivity') < 0
            && x.content.session.indexOf('SignInActivity') < 0){
              return x;
            }
          })})
        }
        //build engagement structure
        this.engageLog = [];
        for(let entry of sessionLog){
          var user = entry.user;
          var engagements: Array<Engagement> = [];
          var currentEngagement: Engagement;
          var previous = entry.logs[entry.logs.length-1]
          for(var i: number = entry.logs.length-1; i >= 0; i--){
            var log = entry.logs[i];
            if(log === previous){
              currentEngagement = {start: new Date(log.content.finishedAt - log.content.elapsed), duration: log.content.elapsed, sessions: []}
              currentEngagement.sessions.push(log)
            }
            else if(previous.content.finishedAt < log.content.finishedAt - log.content.elapsed - this.MIN_SESSION_GAP){
              currentEngagement.duration = previous.content.finishedAt - currentEngagement.start.valueOf();
              engagements.push(currentEngagement)
              currentEngagement = {start: new Date(log.content.finishedAt - log.content.elapsed), duration: log.content.elapsed, sessions: []}
              currentEngagement.sessions.push(log)
            }
            else{
              currentEngagement.sessions.push(log)
            }
            previous = log;
          }
          this.engageLog.push({user: user, engagements: engagements})
        }
        console.log(this.engageLog)
        this.engagementService.setEngageLog(this.engageLog)

      })
    )   
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

}

export interface Engagement{
  start: Date,
  duration: Number,
  sessions: Array<IUsageLogDbEntity>
}
export interface EngageData{
  user: String,
  engagements: Array<Engagement>
}
