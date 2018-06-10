import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../../services/research-api.service';
import { ExperimentService } from '../../services/experiment.service';
import { Subscription } from 'rxjs';
import { flatMap, filter } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { YesNoDialogComponent } from '../../dialogs/yes-no-dialog/yes-no-dialog.component';
import { NotificationService } from '../../services/notification.service';
import { NewTrackingPackageDialogComponent } from './new-tracking-package-dialog/new-tracking-package-dialog.component';

@Component({
  selector: 'app-omnitrack-package-list',
  templateUrl: './omnitrack-package-list.component.html',
  styleUrls: ['./omnitrack-package-list.component.scss']
})
export class OmniTrackPackageListComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()

  private experimentService: ExperimentService
  public packages: Array<any>
  constructor(private api: ResearchApiService, private dialog: MatDialog, private notification: NotificationService) {
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(flatMap(expService => expService.getOmniTrackPackages())).subscribe(packages => {
        this.packages = packages
        console.log(packages)
      })
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  getTrackerColorString(tracker: any): string {
    const colorInt = tracker.color
    if (colorInt) {
      const alpha = (colorInt >> 24) & 0xFF
      const red = (colorInt >> 16) & 0xFF
      const green = (colorInt >> 8) & 0xFF
      const blue = (colorInt) & 0xFF
      return "rgba(" + red + "," + green + "," + blue + "," + (alpha / 255) + ")"
    } else { return "transparent" }
  }

  findTracker(pack, trackerId) {
    return pack.data.trackers.find(tracker => tracker.objectId === trackerId)
  }

  onAddNewPackageClicked() {
    this._internalSubscriptions.add(
      this.dialog.open(NewTrackingPackageDialogComponent, {data: {}}).beforeClose().pipe(
        flatMap(resultData => this.api.selectedExperimentService.pipe(flatMap(service => service.addTrackingPackageJson(resultData.data, resultData.name))))
      ).subscribe(
        changed=>{
          console.log("added tracking package")
          if(changed===true){
            this.notification.pushSnackBarMessage({message: "Added new tracking package."})
          }
        }
      )
    )
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

}
