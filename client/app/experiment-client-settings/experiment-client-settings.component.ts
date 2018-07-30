import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ClientBuildService } from '../services/client-build.service';
import { ResearchApiService } from '../services/research-api.service';

@Component({
  selector: 'app-experiment-client-settings',
  templateUrl: './experiment-client-settings.component.html',
  styleUrls: ['./experiment-client-settings.component.scss'],
  providers: [ClientBuildService]
})
export class ExperimentClientSettingsComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()

  public supportedPlatforms = ["Android"]

  constructor(private api: ResearchApiService, private clientBuildService: ClientBuildService) {

  }

  ngOnInit() {
    this.clientBuildService.initialize(this.api.getSelectedExperimentId())
    this.clientBuildService.reloadBuildStatus()
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }
}