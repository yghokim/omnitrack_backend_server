import { Component, OnInit } from '@angular/core';
import { ResearchVisualizationQueryConfigurationService } from '../services/research-visualization-query-configuration.service';

@Component({
  selector: 'app-experiment-overview',
  templateUrl: './experiment-overview.component.html',
  styleUrls: ['./experiment-overview.component.scss'],
  providers: [ResearchVisualizationQueryConfigurationService]
})
export class ExperimentOverviewComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
