import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../../services/research-api.service';
import { Subscription } from 'rxjs';
import { IUsageLogDbEntity } from '../../../../omnitrack/core/db-entity-types';
import * as moment from 'moment';

@Component({
  selector: 'app-client-crash-logs',
  templateUrl: './client-crash-logs.component.html',
  styleUrls: ['./client-crash-logs.component.scss']
})
export class ClientCrashLogsComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  public isLoading = true
  public logs: Array<IUsageLogDbEntity>

  constructor(private api: ResearchApiService) {
  }

  ngOnInit() {
    this.isLoading = false
    this.reload()
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  reload() {
    if (this.isLoading !== true) {
      this.isLoading = true
      this._internalSubscriptions.add(
        this.api.queryClientErrorLogs({}, moment().subtract(1, 'month').toISOString(), null).subscribe(
          logs => {
            this.logs = logs
            console.log(logs)
          },
          err => {
            console.error(err)
          },
          () => {
            this.isLoading = false
          }
        )
      )
    }
  }

  getErrorMessage(log: IUsageLogDbEntity): string {
    if (log.content) {
      return log.content.message
    } return ""
  }

  getErrorThread(log: IUsageLogDbEntity): string {
    if (log.content) {
      return log.content.thread
    } return ""
  }

  getErrorVersionCode(log: IUsageLogDbEntity): string {
    if (log.content) {
      return log.content.version_code
    } return ""
  }

  getStackTrace(log: IUsageLogDbEntity): string {
    if (log.content) {
      return log.content.stacktrace
    } return ""
  }

}
