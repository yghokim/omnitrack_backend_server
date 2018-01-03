import { Component, OnInit } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { ExperimentService } from '../services/experiment.service';

@Component({
  selector: 'app-experiment-groups',
  templateUrl: './experiment-groups.component.html',
  styleUrls: ['./experiment-groups.component.scss']
})
export class ExperimentGroupsComponent implements OnInit {

  public experimentService: ExperimentService
  constructor(private api: ResearchApiService) {
    api.selectedExperimentService.subscribe(expService => {
      this.experimentService = expService
    })
  }

  ngOnInit() {
  }

  onAddNewGroupClicked() {

  }
}
