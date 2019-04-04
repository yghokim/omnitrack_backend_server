import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { ExperimentService } from '../services/experiment.service';
import { Subscription, Observable, empty } from 'rxjs';
import { flatMap, filter } from 'rxjs/operators';
import { IExperimentGroupDbEntity, IExperimentDbEntity } from '../../../omnitrack/core/research/db-entity-types';
import { MatDialog } from '@angular/material/dialog';
import { YesNoDialogComponent } from '../dialogs/yes-no-dialog/yes-no-dialog.component';
import { EditExperimentGroupDialogComponent } from './edit-experiment-group-dialog/edit-experiment-group-dialog.component';

@Component({
  selector: 'app-experiment-groups',
  templateUrl: './experiment-groups.component.html',
  styleUrls: ['./experiment-groups.component.scss']
})
export class ExperimentGroupsComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  public experimentInfo: IExperimentDbEntity

  constructor(private api: ResearchApiService, private dialog: MatDialog) {

  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService
        .pipe(flatMap(expService => expService.getExperiment()))
        .subscribe(
          experiment => {
            this.experimentInfo = experiment
          })
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  getTrackingPlan(key: string): Observable<any> {
    return this.api.selectedExperimentService.pipe(flatMap(service => service.getTrackingPlan(key)))
  }

  getNumParticipantsOfGroup(groupId: string): Observable<number>{
    return this.api.selectedExperimentService.pipe(flatMap(service => service.getNumParticipantsInGroup(groupId)))
  }

  onUpsertGroupClicked(group: IExperimentDbEntity) {
    this._internalSubscriptions.add(
      this.dialog.open(EditExperimentGroupDialogComponent, {
        data: {
          model: group,
          experimentInfo: this.experimentInfo
        }
      }).afterClosed().pipe(
        flatMap(model => {
          if (model) {
            return this.api.selectedExperimentService.pipe(
              flatMap(expService => {
                return expService.upsertExperimentGroup(model)
              })
            )
          } else {
            return empty()
          }
        }))
        .subscribe(payload => {
          console.log(payload)
          if (group) {
            //update
            const groupIndex = this.experimentInfo.groups.findIndex(g => g._id === payload._id)
            this.experimentInfo.groups[groupIndex] = payload
          }
          else {
            //insert
            this.experimentInfo.groups.push(payload)
          }
        })
    )
  }

  onDeleteGroupClicked(group: IExperimentGroupDbEntity) {
    this._internalSubscriptions.add(
      this.dialog.open(YesNoDialogComponent, {
        data: {
          title: "Remove Group",
          message: "Do you want to remove the group?<br>The participants in this group will be discarded from the experiment.<br>This process cannot be undone.", positiveLabel: "Delete", positiveColor: "warn", negativeColor: "primary"
        }
      })
        .beforeClose()
        .pipe(
          filter(r => r === true),
          flatMap(() => this.api.selectedExperimentService),
          flatMap(service => service.deleteExperimentGroup(group._id))
        )
        .subscribe(res => {
          if (res === true) {
            const index = this.experimentInfo.groups.findIndex(g => g._id === group._id)
            if (index !== -1) {
              this.experimentInfo.groups.splice(index, 1)
            }
          }
        })
    )
  }
}
