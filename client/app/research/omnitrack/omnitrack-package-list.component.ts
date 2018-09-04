import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ResearchApiService } from '../../services/research-api.service';
import { ExperimentService } from '../../services/experiment.service';
import { Subscription, empty } from 'rxjs';
import { flatMap, filter } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { YesNoDialogComponent } from '../../dialogs/yes-no-dialog/yes-no-dialog.component';
import { NotificationService } from '../../services/notification.service';
import { NewTrackingPackageDialogComponent } from './new-tracking-package-dialog/new-tracking-package-dialog.component';
import { ITriggerDbEntity, ITrackerDbEntity } from '../../../../omnitrack/core/db-entity-types';
import { TriggerConstants } from '../../../../omnitrack/core/trigger-constants';

@Component({
  selector: 'app-omnitrack-package-list',
  templateUrl: './omnitrack-package-list.component.html',
  styleUrls: ['./omnitrack-package-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OmniTrackPackageListComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()

  private experimentService: ExperimentService
  public packages: Array<any>
  constructor(private changeDetector: ChangeDetectorRef, private api: ResearchApiService, private dialog: MatDialog, private notification: NotificationService, private router: Router, private activatedRoute: ActivatedRoute) {
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(flatMap(expService => expService.getOmniTrackPackages())).subscribe(packages => {
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
    return entity.objectId
  }

  onAddNewPackageClicked() {
    this._internalSubscriptions.add(
      this.dialog.open(NewTrackingPackageDialogComponent, {data: {api: this.api}}).beforeClose().pipe(
        flatMap(resultData => 
          resultData?
          this.api.selectedExperimentService.pipe(flatMap(service => service.addTrackingPackageJson(resultData.data, resultData.name))): empty()
        )
      ).subscribe(
        changed=>{
          if(changed===true){
            this.notification.pushSnackBarMessage({message: "Added new tracking package."})
          }
        }
      )
    )
  }

  onEditPackageClicked(packageKey: string) {
    this.router.navigate([packageKey], {relativeTo: this.activatedRoute})
  }

  onRemovePackageClicked(packageKey: string) {
    this._internalSubscriptions.add(
      this.dialog.open(YesNoDialogComponent, { data: { title: "Remove Tracking Package", message: "Do you want to remove this package?<br>This process cannot be undone.", positiveLabel: "Delete", positiveColor: "warn", negativeColor: "primary" } }).beforeClose().pipe(
        filter(confirm => confirm === true),
        flatMap(() => this.api.selectedExperimentService),
        flatMap(service => service.removeTrackingPackage(packageKey))
      ).subscribe(
        changed => {
          if(changed === true){

        this.notification.pushSnackBarMessage({message: "Removed the tracking package."})
            const index = this.packages.findIndex(pack => pack.key === packageKey)
            if(index !== -1){
              this.packages.splice(index, 1)
            }
          }
        }
      )
    )
  }

  filterLoggingTriggers(triggers: Array<ITriggerDbEntity>): Array<ITriggerDbEntity>{
    return triggers.filter(t => t.actionType === TriggerConstants.ACTION_TYPE_LOG)
  }

  getRemindersOf(tracker: ITrackerDbEntity, triggers: Array<ITriggerDbEntity>): Array<ITriggerDbEntity>{
    return triggers.filter(t => t.actionType === TriggerConstants.ACTION_TYPE_REMIND && t.trackers.indexOf(tracker["objectId"]) !== -1)
  }

  onPackageEdited(packageKey: string, pack: any){
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(flatMap(service => service.updateTrackingPackageJson(packageKey, pack.data, null))).subscribe(
        result=>{
          if(result === true){
            this.notification.pushSnackBarMessage({message: "Changes were saved."})
          }
        }
      )
    )
  }

}
