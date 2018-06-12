import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../../services/research-api.service';
import { Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { TrackingDataService } from '../../services/tracking-data.service';

@Component({
  selector: 'app-tracking-data-synchronizer-widget',
  templateUrl: './tracking-data-synchronizer-widget.component.html',
  styleUrls: ['./tracking-data-synchronizer-widget.component.scss']
})
export class TrackingDataSynchronizerWidgetComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  trackingDataService: TrackingDataService

  constructor(private api: ResearchApiService) {

  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(
        filter(service => service != null),
        map(service => service.trackingDataService)
      ).subscribe(
        dt => {
          this.trackingDataService = dt
        }
      )
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

}
