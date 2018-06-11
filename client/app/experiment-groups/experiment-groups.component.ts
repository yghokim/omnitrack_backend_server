import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { ExperimentService } from '../services/experiment.service';
import { Subscription, Observable } from 'rxjs';
import { flatMap, filter } from 'rxjs/operators';
import { IExperimentGroupDbEntity } from '../../../omnitrack/core/research/db-entity-types';
import { MatDialog } from '@angular/material/dialog';
import { YesNoDialogComponent } from '../dialogs/yes-no-dialog/yes-no-dialog.component';

@Component({
  selector: 'app-experiment-groups',
  templateUrl: './experiment-groups.component.html',
  styleUrls: ['./experiment-groups.component.scss']
})
export class ExperimentGroupsComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  groups: Array<IExperimentGroupDbEntity> = []

  constructor(private api: ResearchApiService, private dialog: MatDialog) {

  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(flatMap(expService => expService.getExperiment())).subscribe(
        experiment => {
          this.groups = experiment.groups
        })
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  getOmniTrackPackage(key: string): Observable<any> {
    return this.api.selectedExperimentService.pipe(flatMap(service => service.getOmniTrackPackage(key)))
  }

  onAddNewGroupClicked() {

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
            const index = this.groups.findIndex(g => g._id === group._id)
            if (index !== -1) {
              this.groups.splice(index, 1)
            }
          }
        })
    )
  }
}
