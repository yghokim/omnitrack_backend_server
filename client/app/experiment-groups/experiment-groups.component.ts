import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { ExperimentService } from '../services/experiment.service';
import { Subscription ,  Observable } from 'rxjs';
import { flatMap } from 'rxjs/operators';

@Component({
  selector: 'app-experiment-groups',
  templateUrl: './experiment-groups.component.html',
  styleUrls: ['./experiment-groups.component.scss']
})
export class ExperimentGroupsComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  groups: Array<any> = []

  constructor(private api: ResearchApiService) {
    
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(flatMap(expService => expService.getExperiment())).subscribe(
        experiment => {
          this.groups = experiment.groups
        })
    )
  }

  ngOnDestroy(){
    this._internalSubscriptions.unsubscribe()
  }

  getOmniTrackPackage(key: string): Observable<any>{
    return this.api.selectedExperimentService.pipe(flatMap(service=>service.getOmniTrackPackage(key)))
  }

  onAddNewGroupClicked() {

  }
}
