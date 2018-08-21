import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ResearcherAuthService } from '../services/researcher.auth.service';
import { ResearcherPrevilages } from '../../../omnitrack/core/research/researcher';

@Component({
  selector: 'app-server-status-overview',
  templateUrl: './server-status-overview.component.html',
  styleUrls: ['./server-status-overview.component.scss']
})
export class ServerStatusOverviewComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  public isUserPoolAvailable = false
  public isErrorLogAvailable = false

  constructor(private auth: ResearcherAuthService) {
  }

  ngOnInit(): void {
    this._internalSubscriptions.add(
      this.auth.currentResearcher.subscribe(
        researcher => {
          if (researcher.previlage >= ResearcherPrevilages.ADMIN) {
            this.isUserPoolAvailable = true
            this.isErrorLogAvailable = true
          }
        }
      )
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }
}
