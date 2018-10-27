import { Component, OnInit, OnDestroy } from '@angular/core';
import { EngagementDataService } from '../../experiment-overview/client-usage/engagement-data.service';
import { ResearchApiService } from '../../services/research-api.service';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import { logsToEngagements } from '../../../../shared_lib/engagement';

@Component({
  selector: 'app-stat-analytics',
  templateUrl: './stat-analytics.component.html',
  styleUrls: ['./stat-analytics.component.scss'],
  providers: [EngagementDataService]
})
export class StatAnalyticsComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  private engagements: Array<any>
  logs: Array<any>
  usersPerDay: Number = 0
  sessionsPerDay: Number = 0
  medianSessionDur: Number = 0
  averageTimePerDay: Number = 0

  constructor(private api: ResearchApiService, public engagementService: EngagementDataService) { }

  ngOnInit() {

    const startMoment = moment().subtract(8, 'month')
    const endMoment = moment().subtract(6, 'month')

    this._internalSubscriptions.add(
      this.api.queryUsageLogsAnonymized({ name: "session" }, startMoment.toISOString(), endMoment.toISOString()).subscribe(
        list => {
          console.log(list)
          this.engagements = logsToEngagements(list)
          this.engagementService.setEngageLog(this.engagements, null, true, [
            startMoment.unix(),
            endMoment.unix()
          ])
          this.logs = list
          this.sessionsPerDay = this.engagementService.totalSessionsPerDay;
          this.medianSessionDur = this.engagementService.medianSessionDuration;
          this.averageTimePerDay = this.engagementService.timePerUserPerDay;
          console.log(this.engagements)
        }
      )
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  onUsersPerDay(users: number) {
    this.usersPerDay = users;
  }

}
