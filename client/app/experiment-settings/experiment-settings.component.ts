import { Component, OnInit } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { ExperimentService } from '../services/experiment.service';

@Component({
  selector: 'app-experiment-settings',
  templateUrl: './experiment-settings.component.html',
  styleUrls: ['./experiment-settings.component.scss']
})
export class ExperimentSettingsComponent implements OnInit {

  private experiment: any
  private experimentService: ExperimentService

  private manager: any

  constructor(private api: ResearchApiService) {
    api.selectedExperimentService.subscribe(expService => {
      this.experimentService = expService
    })
  }

  ngOnInit() {
    this.api.selectedExperimentService.subscribe(experimentService => {

      this.experimentService.getExperiment().subscribe(exp => {
        this.experiment = exp
      })

      this.experimentService.getManagerInfo().subscribe(
        managerInfo =>

          this.manager = managerInfo
      )
    })
  }

}
