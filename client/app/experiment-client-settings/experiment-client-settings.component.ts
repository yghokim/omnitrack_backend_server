import { Component, OnInit } from "@angular/core";
import { ClientBuildService } from "../services/client-build.service";
import { ResearchApiService } from "../services/research-api.service";

@Component({
  selector: "app-experiment-client-settings",
  templateUrl: "./experiment-client-settings.component.html",
  styleUrls: ["./experiment-client-settings.component.scss"],
  providers: [ClientBuildService]
})
export class ExperimentClientSettingsComponent implements OnInit {

  public supportedPlatforms = ["Android"];

  constructor(
    private api: ResearchApiService,
    private clientBuildService: ClientBuildService
  ) {}

  ngOnInit() {
    if (this.api.getSelectedExperimentId() != null) {
      this.clientBuildService.initializeExperimentMode(this.api.getSelectedExperimentId());
      this.clientBuildService.reloadBuildStatus();
    }
  }
}
