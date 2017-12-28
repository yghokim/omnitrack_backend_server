import { Component, OnInit } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';

@Component({
  selector: 'app-experiment-groups',
  templateUrl: './experiment-groups.component.html',
  styleUrls: ['./experiment-groups.component.scss']
})
export class ExperimentGroupsComponent implements OnInit {

  constructor(private api: ResearchApiService) { }

  ngOnInit() {
  }
  
  onAddNewGroupClicked(){

  }
}
