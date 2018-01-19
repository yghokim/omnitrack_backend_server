import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { ExperimentService } from '../services/experiment.service';
import { Subscription } from 'rxjs/Subscription';
import { ExperimentPermissions } from '../../../omnitrack/core/research/experiment';
import { MatDialog } from '@angular/material';
import { DeleteExperimentConfirmDialogComponent } from '../dialogs/delete-experiment-confirm-dialog/delete-experiment-confirm-dialog.component';
import { NotificationService } from '../services/notification.service';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-experiment-settings',
  templateUrl: './experiment-settings.component.html',
  styleUrls: ['./experiment-settings.component.scss']
})
export class ExperimentSettingsComponent implements OnInit, OnDestroy {

  public experiment: any

  private permissions: ExperimentPermissions

  private _internalSubscriptions = new Subscription()

  constructor(private api: ResearchApiService, private notification: NotificationService, private dialog: MatDialog) {
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.flatMap(expService => expService.getExperiment()).subscribe(experiment => {
        this.experiment = experiment
        console.log(experiment)
      })
    )

    this._internalSubscriptions.add(
      this.api.selectedExperimentService.flatMap(expService => expService.getMyPermissions()).subscribe(permissions => {
        if(permissions){
          this.permissions = permissions
        }
      })
    )
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }

  onDeleteExperimentClicked(){
    this._internalSubscriptions.add(
      this.dialog.open(DeleteExperimentConfirmDialogComponent, {data: {experimentId: this.api.getSelectedExperimentId()}}).afterClosed().filter(
        experimentId=>{
          return experimentId !== null
        }).do(experimentId=>{
          this.notification.registerGlobalBusyTag("experiment-deletion")
        }).flatMap(experimentId=>{
          return this.api.removeExperiment(experimentId)
        }).subscribe(success=>{
          console.log(success)
          this.notification.unregisterGlobalBusyTag("experiment-deletion")
        })
    )
  }

}
