import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { ExperimentService } from '../services/experiment.service';
import { Subscription, Observable } from 'rxjs';
import { flatMap, filter, tap } from 'rxjs/operators';
import { ExperimentPermissions } from '../../../omnitrack/core/research/experiment';
import { MatDialog } from '@angular/material';
import { DeleteExperimentConfirmDialogComponent } from '../dialogs/delete-experiment-confirm-dialog/delete-experiment-confirm-dialog.component';
import { NotificationService } from '../services/notification.service';
import { TextInputDialogComponent } from '../dialogs/text-input-dialog/text-input-dialog.component';
import { isNullOrBlank } from '../../../shared_lib/utils';
import { Router, ActivatedRoute } from '@angular/router';
import { IExperimentDbEntity } from '../../../omnitrack/core/research/db-entity-types';
import * as marked from 'marked';

@Component({
  selector: 'app-experiment-settings',
  templateUrl: './experiment-settings.component.html',
  styleUrls: ['./experiment-settings.component.scss']
})
export class ExperimentSettingsComponent implements OnInit, OnDestroy {

  public experiment: IExperimentDbEntity

  public permissions: ExperimentPermissions

  private _internalSubscriptions = new Subscription()

  public isConsentExpanded = false

  constructor(private api: ResearchApiService, private notification: NotificationService, private dialog: MatDialog, private router: Router, private activatedRoute: ActivatedRoute) {
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(flatMap(expService => expService.getExperiment())).subscribe(experiment => {
        this.experiment = experiment
      })
    )

    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(flatMap(expService => expService.getMyPermissions())).subscribe(permissions => {
        if (permissions) {
          this.permissions = permissions
        }
      })
    )
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }

  onEditNameClicked() {
    this._internalSubscriptions.add(
      this.dialog.open(TextInputDialogComponent, {
        data: {
          title: "Edit Experiment Name",
          placeholder: "Insert experiment name",
          prefill: this.experiment.name,
          validator: (text) => { return text !== this.experiment.name && !isNullOrBlank(text) && text.length < 100 },
          submit: (newExperimentName) => {
            console.log("new experiment name: " + newExperimentName)
            return this.api.updateExperiment(this.experiment._id, { name: newExperimentName })
          }
        }
      }).afterClosed().subscribe(
        newExperimentName => {

        }
      )
    )
  }

  onDeleteExperimentClicked() {
    this._internalSubscriptions.add(
      this.dialog.open(DeleteExperimentConfirmDialogComponent, { data: { experimentId: this.api.getSelectedExperimentId() } }).afterClosed().pipe(
        filter(
          experimentId => {
            return experimentId !== null
          }),
        tap(experimentId => {
          this.notification.registerGlobalBusyTag("experiment-deletion")
        }),
        flatMap(experimentId => {
          return this.api.removeExperiment(experimentId)
        })
      )
        .subscribe()
    )
  }

  onAskConsentInAppToggled(value: boolean) {
    this._internalSubscriptions.add(
      this.api.updateExperiment(this.experiment._id, {
        receiveConsentInApp: value
      }).subscribe(
        changed => {
          if (changed === true) {
            this.experiment.receiveConsentInApp = value
          }
        }
      )
    )
  }

  isConsentFormContentAvailable(): boolean {
    return this.experiment.consent!=null && this.experiment.consent.trim().length > 0
  }

  onEditConsentFormClicked(){
    this.router.navigate(["consent"], {relativeTo: this.activatedRoute.parent})
  }

  getTransformedConsent(): string{
    return marked(this.experiment.consent)
  }
}
