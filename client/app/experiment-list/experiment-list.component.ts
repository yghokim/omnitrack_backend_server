import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { ResearchApiService } from '../services/research-api.service';
import ExperimentInfo from '../models/experiment-info';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { ResearcherAuthService } from '../services/researcher.auth.service';


@Component({
  selector: 'app-experiment-list',
  templateUrl: './experiment-list.component.html',
  styleUrls: ['./experiment-list.component.scss']
})
export class ExperimentListComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  experiments: Array<ExperimentInfo>

  constructor(private api: ResearchApiService, private auth: ResearcherAuthService, private router: Router) {
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.getExperimentInfos().subscribe(
        experiments => {
          this.experiments = experiments
        }
      )
    )
  }
  
  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }

  onExperimentClicked(experiment: ExperimentInfo){
    this.router.navigate(["/research/dashboard", experiment._id])
  }


  getMyRole(exp: ExperimentInfo): Observable<string>{
    return this.auth.currentResearcher.map(researcher=>{
      if(exp.manager._id === researcher.uid)
      {
        return "manager"
      }
      else return "collaborator"
    })
  }

}
