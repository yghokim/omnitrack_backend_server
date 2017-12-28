import { Component, OnInit } from '@angular/core';
import { ResearchApiService } from '../../services/research-api.service';
import { ExperimentService } from '../../services/experiment.service';

@Component({
  selector: 'app-omnitrack-package-list',
  templateUrl: './omnitrack-package-list.component.html',
  styleUrls: ['./omnitrack-package-list.component.scss']
})
export class OmniTrackPackageListComponent implements OnInit {

  private experimentService: ExperimentService
  constructor(private api: ResearchApiService) {
    this.experimentService = api.selectedExperimentService()
  }

  ngOnInit() {
    this.experimentService.getOmniTrackPackages().subscribe(packages=>{
      console.log(packages)
    })
  }

  onAddNewPackageClicked(){

  }

}
