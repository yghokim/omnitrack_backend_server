import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../../services/research-api.service';
import { ResearchVisualizationQueryConfigurationService } from '../../services/research-visualization-query-configuration.service';
import { query } from '@angular/animations';
import { Subscription } from 'rxjs';
import { combineLatest, flatMap } from 'rxjs/operators';

@Component({
  selector: 'app-client-usage',
  templateUrl: './client-usage.component.html',
  styleUrls: ['./client-usage.component.scss']
})
export class ClientUsageComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  constructor(private queryConfigService: ResearchVisualizationQueryConfigurationService,
    private api: ResearchApiService) {
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.queryConfigService.makeScopeAndParticipantsObservable(true).pipe(
        combineLatest(this.api.selectedExperimentService, (result, expService) => ({ participantsAndScope: result, expService: expService })),
        flatMap(result =>
          result.expService.queryUsageLogsPerParticipant(null, result.participantsAndScope.participants.map(p => p.user._id))
        )
      ).subscribe(usageLogQueryResult => {
        console.log(usageLogQueryResult)
      })
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

}
