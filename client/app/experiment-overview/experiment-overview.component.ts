import { Component, OnInit } from '@angular/core';
import { ResearchOverviewDataService } from '../services/research-overview-data.service';

@Component({
  selector: 'app-experiment-overview',
  templateUrl: './experiment-overview.component.html',
  styleUrls: ['./experiment-overview.component.scss'],
  providers: [ResearchOverviewDataService]
})
export class ExperimentOverviewComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
