import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TrackingPlanService } from '../tracking-plan.service';
import { ResearchApiService } from '../../../services/research-api.service';
import { Subscription } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import { IExperimentTrackingPlanDbEntity } from '../../../../../omnitrack/core/research/db-entity-types';
import { deepclone } from '../../../../../shared_lib/utils';
import { ITrackerDbEntity, ITriggerDbEntity } from '../../../../../omnitrack/core/db-entity-types';

import { getTrackerColorString } from '../omnitrack-helper';
import { NotificationService } from '../../../services/notification.service';
import * as deepEqual from 'deep-equal';

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
    private planService: TrackingPlanService,
    private activatedRoute: ActivatedRoute,
    private changeDetector: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {
  }

  ngOnInit() {
    const planKey = this.activatedRoute.snapshot.params["planKey"]
    if (planKey != null) {
      this._internalSubscriptions.add(
        this.api.selectedExperimentService.pipe(
          flatMap(service => service.getTrackingPlan(planKey))
        ).subscribe(plan => {
          console.log(plan)
          this.originalPlanData = deepclone(plan)
          this.currentPlanData = deepclone(plan)
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

  onTrackerClicked(tracker: ITrackerDbEntity) {
    this.selectedEntity = tracker
    this.selectedType = 'tracker'
  }

  isChanged(): boolean {
    return deepEqual(this.originalPlanData, this.currentPlanData) === false
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
}
