import { Component, OnInit } from '@angular/core';
import { ResearcherAuthService } from '../services/researcher.auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ResearchApiService } from '../services/research-api.service';
import ExperimentInfo from '../models/experiment-info';

@Component({
  selector: 'app-research-dashboard',
  templateUrl: './research-dashboard.component.html',
  styleUrls: ['./research-dashboard.component.scss']
})
export class ResearchDashboardComponent implements OnInit {

  isLoadingSelectedExperiment: boolean = true
  isLoadingExperiments: boolean = true
  experimentInfos: Array<ExperimentInfo> = []

  constructor(
    private api: ResearchApiService,
    private authService: ResearcherAuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    //init experiment infos

    this.activatedRoute.queryParamMap.subscribe(queryParamMap=>{
      const paramExpId = queryParamMap["params"].exp_id
      if (paramExpId) {
        console.log("mount an experiment : " + paramExpId)
        localStorage.setItem("selectedExperiment", paramExpId)
        this.api.setSelectedExperimentId(paramExpId).subscribe((exp)=>{
          this.isLoadingSelectedExperiment = false
        })
      }
      else {
        this.api.getExperimentInfos().subscribe(experiments => {
          this.isLoadingExperiments = false
          this.experimentInfos = experiments
          if (this.experimentInfos.length > 0) {
            var selectedId = localStorage.getItem("selectedExperiment") || this.experimentInfos[0].id
            if (this.experimentInfos.findIndex(exp => exp.id == selectedId) == -1) {
              selectedId = this.experimentInfos[0].id
            }
            this.router.navigate(['research/dashboard'], { queryParams: { exp_id: selectedId } })
          }
        })
      }
    })

    this.api.getExperimentInfos().subscribe(experiments => {
      console.log("experiments were loaded.")
      this.isLoadingExperiments = false
      this.experimentInfos = experiments
    })
  }

  onExperimentSelected(id) {
    this.isLoadingSelectedExperiment = true
    this.api.setSelectedExperimentId(id).subscribe((exp)=>{
      this.isLoadingSelectedExperiment = false
    })
  }

  signOut() {
    this.authService.signOut().subscribe((signedOut) => {
      console.log("successfully signed out.")
      this.goToSignIn()
    })
  }

  goToSignIn() {
    this.router.navigate(['/research/login'])
  }

}
