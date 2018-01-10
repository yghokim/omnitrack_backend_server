import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { ExperimentService } from '../services/experiment.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-experiment-settings',
  templateUrl: './experiment-settings.component.html',
  styleUrls: ['./experiment-settings.component.scss']
})
export class ExperimentSettingsComponent implements OnInit, OnDestroy {

  public experiment: any

  private _internalSubscriptions = new Subscription()

  constructor(private api: ResearchApiService) {
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.flatMap(expService => expService.getExperiment()).subscribe(experiment => {
        this.experiment = experiment
        console.log(experiment)
      })
    )
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }

  onAddCollaboratorClicked(){
    
  }

}
