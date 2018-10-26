import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { ResearchApiService } from '../services/research-api.service';
import { Router } from '@angular/router';
import { ResearcherAuthService } from '../services/researcher.auth.service';
import { MatDialog } from '@angular/material';
import { NewExperimentDialogComponent } from './new-experiment-dialog/new-experiment-dialog.component';
import { NotificationService } from '../services/notification.service';
import { ExampleExperimentInfo } from '../../../omnitrack/core/research/experiment';
import { map, tap } from 'rxjs/operators';
import { IExperimentDbEntity } from '../../../omnitrack/core/research/db-entity-types';
import { getIdPopulateCompat } from '../../../omnitrack/core/db-entity-types';
import * as moment from 'moment';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-experiment-list',
  templateUrl: './experiment-list.component.html',
  styleUrls: ['./experiment-list.component.scss'],
  animations: [
    trigger('experimentHover', [
      state('*', style({
        transform: 'translateY(0)',
        'box-shadow': '0px 3px 5px rgba(0, 0, 0, 0.17)'
      })),
      state('hover', style({
        transform: 'translateY(-6px)',
        'box-shadow': '0px 8px 8px rgba(0, 0, 0, 0.17)'
      })),
      transition('* => hover', [animate('250ms ease-out')]),
      transition('hover => *', [animate('150ms ease-out')])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentListComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  experiments: Array<IExperimentDbEntity>

  examples: Array<ExampleExperimentInfo>

  public hoverExperimentIndex = -1

  constructor(private api: ResearchApiService, private auth: ResearcherAuthService, private router: Router, private dialog: MatDialog, private notification: NotificationService, private changeDetector: ChangeDetectorRef) {
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.getExperimentInfos().subscribe(
        experiments => {
          this.experiments = experiments
          this.changeDetector.markForCheck()
        }
      )
    )

    this._internalSubscriptions.add(
      this.api.getExampleExperimentList().subscribe(
        examples => {
          this.examples = examples
          this.changeDetector.markForCheck()
        }
      )
    )

  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }

  trackByExperimentId(index, obj) {
    return obj._id
  }

  onExperimentClicked(experiment: IExperimentDbEntity) {
    this.router.navigate(["/research/dashboard", experiment._id])
  }

  onNewExperimentClicked() {
    this._internalSubscriptions.add(
      this.dialog.open(NewExperimentDialogComponent).afterClosed().subscribe(
        experimentBuildInfo => {
          if (experimentBuildInfo) {
            this._internalSubscriptions.add(
              this.api.createExperiment(experimentBuildInfo).subscribe(
                experiment => {
                  if (experiment) {
                    console.log("created new experiment.")
                    this.notification.pushSnackBarMessage({ message: "Created new experiment." })
                  }
                }, err => {
                  console.log(err)
                  this.notification.pushSnackBarMessage({ message: "Failed to create new experiment." })
                }
              ))
          }
        }
      )
    )
  }

  onAddExampleClicked(exampleKey) {
    this._internalSubscriptions.add(
      this.api.addExampleExperimentAndGetId(exampleKey).pipe(tap(() => {
        this.notification.pushSnackBarMessage({ message: "Created new experiment." })
      })).subscribe(
        newExperimentId => {
        }
      )
    )
  }

  getMyRole(exp: IExperimentDbEntity): Observable<string> {
    return this.auth.currentResearcher.pipe(map(researcher => {
      if (getIdPopulateCompat(exp.manager) === researcher.uid) {
        return "manager"
      }
      else return "collaborator"
    }))
  }

  getStartDate(experiment: IExperimentDbEntity): string {
    if (experiment.createdAt == null) {
      return null
    } else return moment(experiment.createdAt).format("MMM DD, YYYY")
  }

  getFinishDate(experiment: IExperimentDbEntity): string {
    if (experiment.finishDate == null) {
      return null
    } else return moment(experiment.finishDate).format("MMM DD, YYYY")
  }

}
