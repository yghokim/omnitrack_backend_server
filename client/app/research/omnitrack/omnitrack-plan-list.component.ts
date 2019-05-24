import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ResearchApiService } from '../../services/research-api.service';
import { ExperimentService } from '../../services/experiment.service';
import { Subscription, empty } from 'rxjs';
import { flatMap, filter } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { YesNoDialogComponent } from '../../dialogs/yes-no-dialog/yes-no-dialog.component';
import { NotificationService } from '../../services/notification.service';
import { NewTrackingPlanDialogComponent } from './new-tracking-plan-dialog/new-tracking-plan-dialog.component';
import { ITriggerDbEntity, ITrackerDbEntity } from '../../../../omnitrack/core/db-entity-types';
import { TriggerConstants } from '../../../../omnitrack/core/trigger-constants';

@Component({
  selector: 'app-omnitrack-plan-list',
  templateUrl: './omnitrack-plan-list.component.html',
  styleUrls: ['./omnitrack-plan-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OmniTrackPlanListComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()

  private experimentService: ExperimentService
  public packages: Array<any>
  constructor(private changeDetector: ChangeDetectorRef, private api: ResearchApiService, private dialog: MatDialog, private notification: NotificationService, private router: Router, private activatedRoute: ActivatedRoute) {
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(flatMap(expService => expService.getTrackingPlans())).subscribe(packages => {
        this.packages = packages
        this.changeDetector.markForCheck()
      })
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  trackByPackage(index, pack){
    return pack.key
  }

  trackByEntity(index, entity){
    return entity._id
  }

  onAddNewPackageClicked() {
    this._internalSubscriptions.add(
      this.dialog.open(NewTrackingPlanDialogComponent, {data: {api: this.api}}).beforeClose().pipe(
        flatMap(resultData => 
          resultData?
          this.api.selectedExperimentService.pipe(flatMap(service => service.addTrackingPlanJson(resultData.data, resultData.name))): empty()
        )
      ).subscribe(
        changed=>{
          if(changed===true){
            this.notification.pushSnackBarMessage({message: "Added new tracking plan."})
          }
        }
      )
    )
  }

  onEditPlanClicked(packageKey: string) {
    this.router.navigate([packageKey], {relativeTo: this.activatedRoute})
  }

  onRemovePlanClicked(planKey: string) {
    this._internalSubscriptions.add(
      this.dialog.open(YesNoDialogComponent, { data: { title: "Remove Tracking Plan", message: "Do you want to remove this plan?<br>This process cannot be undone.", positiveLabel: "Delete", positiveColor: "warn", negativeColor: "primary" } }).beforeClose().pipe(
        filter(confirm => confirm === true),
        flatMap(() => this.api.selectedExperimentService),
        flatMap(service => service.removeTrackingPlan(planKey))
      ).subscribe(
        changed => {
          if(changed === true){

        this.notification.pushSnackBarMessage({message: "Removed the tracking plan."})
            const index = this.packages.findIndex(plan => plan.key === planKey)
            if(index !== -1){
              this.packages.splice(index, 1)
            }
          }
        }
      )
    )
  }

  onPlanEdited(packageKey: string, pack: any){
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(flatMap(service => service.updateTrackingPlanJson(packageKey, pack, null))).subscribe(
        result=>{
          if(result === true){
            this.notification.pushSnackBarMessage({message: "Changes were saved."})
          }
        }
      )
    )
  }

}
