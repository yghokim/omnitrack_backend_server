import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TrackingPlanService } from '../tracking-plan.service';
import { ResearchApiService } from '../../../services/research-api.service';
import { Subscription } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import { IExperimentTrackingPlanDbEntity } from '../../../../../omnitrack/core/research/db-entity-types';
import { deepclone } from '../../../../../shared_lib/utils';
import { ITrackerDbEntity, ITriggerDbEntity } from '../../../../../omnitrack/core/db-entity-types';

import { getTrackerColorString, makeShortenConditionString } from '../omnitrack-helper';
import { NotificationService } from '../../../services/notification.service';
import * as deepEqual from 'deep-equal';
import { TrackingPlan } from '../../../../../omnitrack/core/tracking-plan';
import { MatDialog } from '@angular/material';
import { YesNoDialogComponent } from '../../../dialogs/yes-no-dialog/yes-no-dialog.component';
import { TriggerConstants } from '../../../../../omnitrack/core/trigger/trigger-constants';

@Component({
  selector: 'app-tracking-plan-detail',
  templateUrl: './tracking-plan-detail.component.html',
  styleUrls: ['./tracking-plan-detail.component.scss', '../../../code-editor.scss'],
  providers: [TrackingPlanService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackingPlanDetailComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()
  originalPlanData: IExperimentTrackingPlanDbEntity = null
  currentPlanData: IExperimentTrackingPlanDbEntity = null

  public selectedType: string = null
  public selectedEntity: ITrackerDbEntity | ITriggerDbEntity = null

  constructor(
    private api: ResearchApiService,
    public planService: TrackingPlanService,
    private activatedRoute: ActivatedRoute,
    private changeDetector: ChangeDetectorRef,
    private notificationService: NotificationService,
    private matDialog: MatDialog
  ) {
  }

  ngOnInit() {
    const planKey = this.activatedRoute.snapshot.params["planKey"]
    if (planKey != null) {
      this._internalSubscriptions.add(
        this.api.selectedExperimentService.pipe(
          flatMap(service => service.getTrackingPlan(planKey))
        ).subscribe(plan => {
          this.originalPlanData = deepclone(plan)
          this.originalPlanData.data = TrackingPlan.fromJson(this.originalPlanData.data)
          this.currentPlanData = deepclone(plan)
          this.currentPlanData.data = TrackingPlan.fromJson(this.currentPlanData.data)
          this.planService.currentPlan = this.currentPlanData.data
          this.changeDetector.markForCheck()
        }, err => {
          console.error(err)
        })
      )
    }
  }

  getTrackerColorString(tracker: any): string {
    return getTrackerColorString(tracker)
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  trackByObj(index, obj) {
    return obj._id
  }

  unselect() {
    this.selectedEntity = null
    this.selectedType = null
  }

  getTriggerTitle(trigger: ITriggerDbEntity): string {
    return makeShortenConditionString(trigger)
  }

  onTrackerClicked(tracker: ITrackerDbEntity) {
    this.selectedEntity = tracker
    this.selectedType = 'tracker'
  }

  onTriggerClicked(trigger: ITriggerDbEntity) {
    this.selectedEntity = trigger
    this.selectedType = 'trigger'
  }

  isChanged(): boolean {
    if (this.originalPlanData.name !== this.currentPlanData.name) {
      return true
    } else {
      return TrackingPlan.isEqual(this.originalPlanData.data, this.currentPlanData.data) === false
    }
  }

  onAppFlagsChanged(flags: any) {
    if (this.currentPlanData.data.app) {
      this.currentPlanData.data.app.lockedProperties = flags
    } else {
      this.currentPlanData.data.app = {
        lockedProperties: flags
      }
    }
  }

  onDiscardChangesClicked() {
    this.currentPlanData = deepclone(this.originalPlanData)
    if (this.selectedEntity) {
      switch (this.selectedType) {
        case 'tracker':
          this.selectedEntity = this.currentPlanData.data.trackers.find(t => t._id === this.selectedEntity._id)
          break;
        case 'trigger':
          this.selectedEntity = this.currentPlanData.data.triggers.find(t => t._id === this.selectedEntity._id)
          break;
      }
    }
    this.planService.currentPlan = this.currentPlanData.data
    this.changeDetector.markForCheck()
  }

  onSaveClicked() {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(
        flatMap(expService => expService.updateTrackingPlanJson(this.originalPlanData.key, this.currentPlanData.data, this.currentPlanData.name))).subscribe(changed => {
          this.notificationService.pushSnackBarMessage({
            message: "Saved changes in the plan."
          })
        })
    )
  }

  onAddTrackerClicked() {
    this.selectedEntity = this.currentPlanData.data.appendNewTracker();
    this.selectedType = 'tracker'
    this.changeDetector.markForCheck()
  }

  onRemoveTrackerClicked(tracker: ITrackerDbEntity) {
    this._internalSubscriptions.add(
      this.matDialog.open(YesNoDialogComponent,
        {
          data: {
            title: "Remove tracker",
            message: "Do you want to remove the tracker?"
          }
        }).afterClosed().subscribe((result) => {
          if (result === true) {
            if (this.currentPlanData.data.removeTracker(tracker)) {
              if (this.selectedEntity === tracker) {
                this.unselect()
              }
              this.changeDetector.markForCheck()
            }
          }
        })
    )
  }

  onAddTriggerClicked() {
    this.selectedEntity = this.currentPlanData.data.appendNewTrigger(TriggerConstants.ACTION_TYPE_LOG, TriggerConstants.CONDITION_TYPE_TIME)
    this.selectedType = 'trigger'
    this.changeDetector.markForCheck()
  }

  onRemoveTriggerClicked(trigger: ITriggerDbEntity) {
    this._internalSubscriptions.add(
      this.matDialog.open(YesNoDialogComponent,
        {
          data: {
            title: "Remove Trigger",
            message: "Do you want to remove the trigger?"
          }
        }).afterClosed().subscribe((result) => {
          if (result === true) {
            if (this.currentPlanData.data.removeTrigger(trigger)) {
              if (this.selectedEntity._id === trigger._id) {
                this.unselect()
              }
              this.changeDetector.markForCheck()
            }
          }
        })
    )
  }
}
