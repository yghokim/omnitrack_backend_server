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
    private changeDetector: ChangeDetectorRef) {
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

}
