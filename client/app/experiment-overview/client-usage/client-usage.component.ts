import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../../services/research-api.service';
import { ResearchVisualizationQueryConfigurationService } from '../../services/research-visualization-query-configuration.service';
import { IParticipantDbEntity } from '../../../../omnitrack/core/db-entity-types';
import { EngagementDataService } from './engagement-data.service';
import { logsToEngagements, EngageData } from '../../../../shared_lib/engagement';
import { Subscription } from 'rxjs';
import { combineLatest, flatMap, map } from 'rxjs/operators';

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
  private engageLog: Array<EngageData> =[]
  private participants: Array<IParticipantDbEntity>
  private includeWeekends: boolean;
  private relativeDayScope: Array<number> = [];

  constructor(private queryConfigService: ResearchVisualizationQueryConfigurationService, private api: ResearchApiService, public engagementService: EngagementDataService) {
   }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.queryConfigService.makeScopeAndParticipantsObservable(true)
      .pipe(
        combineLatest(this.api.selectedExperimentService, (result, expService)=> ({participantsAndScope: result, expService: expService})),
        flatMap(result =>{
          return result.expService.queryUsageLogsPerParticipant(null, result.participantsAndScope.participants.map(p=>p.user._id)).pipe(map(x => ({logsPerUser: x , participants: result.participantsAndScope.participants, includeWeekends: result.participantsAndScope.scope.includeWeekends})))
        })
      ).subscribe(usageLogQueryResult=>{

        //set interactive info: partipicants, include Weekends flag etc.
        this.usageLog = usageLogQueryResult.logsPerUser;
        this.participants = usageLogQueryResult.participants;
        this.includeWeekends = usageLogQueryResult.includeWeekends;

        this.engageLog = logsToEngagements(this.usageLog)

        this._internalSubscriptions.add(this.queryConfigService.dayIndexRange().subscribe(result => {
          this.relativeDayScope = result;
          //this.engagementService.setDayScope(result);
        }))
        this.engagementService.setEngageLog(this.engageLog, this.participants, this.includeWeekends, this.relativeDayScope)
      })
    )   
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  

}

