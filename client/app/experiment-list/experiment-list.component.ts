import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { ResearchApiService } from '../services/research-api.service';
import ExperimentInfo from '../models/experiment-info';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { ResearcherAuthService } from '../services/researcher.auth.service';
import { MatDialog } from '@angular/material';
import { NewExperimentDialogComponent } from './new-experiment-dialog/new-experiment-dialog.component';
import { NotificationService } from '../services/notification.service';


@Component({
  selector: 'app-experiment-list',
  templateUrl: './experiment-list.component.html',
  styleUrls: ['./experiment-list.component.scss']
})
export class ExperimentListComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  experiments: Array<ExperimentInfo>

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
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }

  onExperimentClicked(experiment: ExperimentInfo) {
    this.router.navigate(["/research/dashboard", experiment._id])
  }

  onNewExperimentClicked() {
    this._internalSubscriptions.add(
      this.dialog.open(NewExperimentDialogComponent).afterClosed().subscribe(
        experimentBuildInfo=>{
          if(experimentBuildInfo)
          {
            console.log(experimentBuildInfo)
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

  getMyRole(exp: ExperimentInfo): Observable<string> {
    return this.auth.currentResearcher.map(researcher => {
      if (exp.manager._id === researcher.uid) {
        return "manager"
      }
      else return "collaborator"
    })
  }

}
