import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription ,  Observable } from 'rxjs';
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

@Component({
  selector: 'app-experiment-list',
  templateUrl: './experiment-list.component.html',
  styleUrls: ['./experiment-list.component.scss']
})
export class ExperimentListComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  experiments: Array<IExperimentDbEntity>

  examples: Array<ExampleExperimentInfo>

  constructor(private api: ResearchApiService, private auth: ResearcherAuthService, private router: Router, private dialog: MatDialog, private notification: NotificationService) {
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.getExperimentInfos().subscribe(
        experiments => {
          this.experiments = experiments
        }
      )
    )

    this._internalSubscriptions.add(
      this.api.getExampleExperimentList().subscribe(
        examples => {
          this.examples = examples
        }
      )
    )
    
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }

  onExperimentClicked(experiment: IExperimentDbEntity) {
    this.router.navigate(["/research/dashboard", experiment._id])
  }

  onNewExperimentClicked() {
    this._internalSubscriptions.add(
      this.dialog.open(NewExperimentDialogComponent).afterClosed().subscribe(
        experimentBuildInfo=>{
          if(experimentBuildInfo)
          {
            this._internalSubscriptions.add(
            this.api.createExperiment(experimentBuildInfo).subscribe(
              experiment => {
                if(experiment){
                  console.log("created new experiment.")
                  this.notification.pushSnackBarMessage({message: "Created new experiment."})
                }
              }, err => {
                console.log(err)
                this.notification.pushSnackBarMessage({message: "Failed to create new experiment."})
              }
            ))
          }
        }
      )
    )
  }

  onAddExampleClicked(exampleKey){
    this._internalSubscriptions.add(
      this.api.addExampleExperimentAndGetId(exampleKey).pipe(tap(()=>{
        this.notification.pushSnackBarMessage({message: "Created new experiment."})
      })).subscribe(
        newExperimentId=>{
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

}
