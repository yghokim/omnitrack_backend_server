import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TrackingPlanService } from '../tracking-plan.service';
import { ResearchApiService } from '../../../services/research-api.service';
import { Subscription } from 'rxjs';
import { flatMap, filter } from 'rxjs/operators';
import { IExperimentTrackingPlanDbEntity } from '../../../../../omnitrack/core/research/db-entity-types';
import { deepclone } from '../../../../../shared_lib/utils';
import { ITrackerDbEntity, ITriggerDbEntity } from '../../../../../omnitrack/core/db-entity-types';

import { getTrackerColorString, makeShortenConditionString } from '../omnitrack-helper';
import { NotificationService } from '../../../services/notification.service';
import { TrackingPlan } from '../../../../../omnitrack/core/tracking-plan';
import { MatDialog } from '@angular/material';
import { YesNoDialogComponent } from '../../../dialogs/yes-no-dialog/yes-no-dialog.component';
import { TriggerConstants } from '../../../../../omnitrack/core/trigger/trigger-constants';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeCheckComponent } from '../../../components/change-check.component';
import { trigger, transition, style, animate } from '@angular/animations';
import { PlanBrushAndLinkingService, InteractivePlanObjectType, BrushAndLinkingEvent } from '../plan-brush-and-linking.service';

@Component({
  selector: 'app-tracking-plan-detail',
  templateUrl: './tracking-plan-detail.component.html',
  styleUrls: ['./tracking-plan-detail.component.scss', '../../../code-editor.scss'],
  providers: [TrackingPlanService, PlanBrushAndLinkingService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('showHideTrigger', [
      transition(':enter', [
        style({ width: 0, overflowX: 'hidden' }),
        animate('0.5s ease-in-out', style({ width: '*' })),
      ]),
      transition(':leave', [
        style({ overflowX: 'hidden' }),
        animate('0.5s ease-in-out', style({ width: 0 }))
      ])
    ]),
  ]
})
export class TrackingPlanDetailComponent extends ChangeCheckComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()
  originalPlanData: IExperimentTrackingPlanDbEntity = null
  currentPlanData: IExperimentTrackingPlanDbEntity = null

  public currentHoveringInfo: BrushAndLinkingEvent = null

  constructor(
    private api: ResearchApiService,
    public planService: TrackingPlanService,
    private activatedRoute: ActivatedRoute,
    private changeDetector: ChangeDetectorRef,
    private notificationService: NotificationService,
    private matDialog: MatDialog,
    public brushAndLinking: PlanBrushAndLinkingService
  ) {
    super()
  }

  ngOnInit() {
    const planKey = this.activatedRoute.snapshot.params["planKey"]
    if (planKey != null) {
      this._internalSubscriptions.add(
        this.api.selectedExperimentService.pipe(
          flatMap(service => service.getTrackingPlan(planKey)),
          filter(plan => plan != null)
        ).subscribe(plan => {
          this.originalPlanData = deepclone(plan)
          this.originalPlanData.data = TrackingPlan.fromJson(this.originalPlanData.data)
          this.currentPlanData = deepclone(plan)
          this.currentPlanData.data = TrackingPlan.fromJson(this.currentPlanData.data)
          TrackingPlan.migrate(this.currentPlanData.data)
          this.planService.currentPlan = this.currentPlanData.data
          /*
          if (this.selectedEntity != null) {
            const selectedId = this.selectedEntity._id
            let newInstance
            switch (this.selectedType) {
              case "tracker":
                newInstance = this.currentPlanData.data.trackers.find(t => t._id === selectedId)
                break;
              case "trigger":
                newInstance = this.currentPlanData.data.triggers.find(t => t._id === selectedId)
                break;
            }

            if (newInstance != null) {
              this.selectedEntity = newInstance
            } else {
              this.unselect()
            }
          }*/

          this.changeDetector.markForCheck()
        }, err => {
          console.error(err)
        })
      )
    }

    /*
    this._internalSubscriptions.add(
      this.brushAndLinking.objectClickEvent.subscribe(event => {
        switch (event.objectType) {
          case InteractivePlanObjectType.Trigger:
            switch (event.obj.actionType) {
              case TriggerConstants.ACTION_TYPE_REMIND:
                this.selectedType = 'tracker'
                this.selectedEntity = event.obj.trackers[0]
                break;
              case TriggerConstants.ACTION_TYPE_LOG:
                this.selectedType = 'trigger'
                this.selectedEntity = event.obj
                break;
            }
            break;

          case InteractivePlanObjectType.Tracker:
            this.selectedType = 'tracker'
            this.selectedEntity = event.obj
            break;

          case InteractivePlanObjectType.Field:
              this.selectedType = 'tracker'
              this.selectedEntity = event.obj.trackerId
            break;
        }
      })
    )*/

    this._internalSubscriptions.add(
      this.brushAndLinking.objectClickEvent.subscribe(event => {
        switch (event.objectType) {
          case InteractivePlanObjectType.Trigger:
            switch (event.obj.actionType) {
              case TriggerConstants.ACTION_TYPE_REMIND:
                this.planService.selectReminder(event.obj)
                break;
              case TriggerConstants.ACTION_TYPE_LOG:
                this.planService.selectLoggingTrigger(event.obj)
                break;
            }
            break;

          case InteractivePlanObjectType.Tracker:
            this.planService.selectTracker(event.obj)
            break;

          case InteractivePlanObjectType.Field:
            this.planService.selectField(event.obj)
            break;
        }
      })
    )
  }

  get sortedTrackerIds(): Array<string> {
    const list = this.currentPlanData.data.trackers.slice(0)
    list.sort((a, b) => {
      if (a.position < b.position) {
        return 1
      } else if (a.position > b.position) {
        return -1
      } else { return 0 }
    })
    return list.map(t => t._id)
  }

  trackerById(id: string): ITrackerDbEntity {
    return this.currentPlanData.data.trackers.find(t => {
      return t._id === id
    })
  }

  onTrackerDragDrop(event: any) {
    const newList = this.sortedTrackerIds.slice(0)
    moveItemInArray(newList, event.previousIndex, event.currentIndex);
    this.currentPlanData.data.trackers.forEach(
      t => {
        t.position = Math.max(newList.length - 1 - newList.indexOf(t._id), 0)
      }
    )
    this.changeDetector.markForCheck()
  }

  getTrackerColorString(tracker: any): string {
    return getTrackerColorString(tracker)
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  unselect() {
    this.planService.unselectAll()
  }

  getTriggerTitle(trigger: ITriggerDbEntity): string {
    return makeShortenConditionString(trigger)
  }

  onTrackerClicked(tracker: ITrackerDbEntity) {
    if (this.planService.isIdSelectedInNavSync(tracker._id) === true) {
      this.unselect()
    } else {
      this.planService.selectTracker(tracker)
    }
  }

  onTriggerClicked(trigger: ITriggerDbEntity) {
    if (this.planService.isIdSelectedInNavSync(trigger._id) === true) {
      this.unselect()
    } else {
      this.planService.selectLoggingTrigger(trigger)
    }
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
    this.changeDetector.markForCheck()
  }

  /*
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
  }*/


  canDeactivate(): boolean {
    return this.isChanged() === false
  }

  deactivationCheckMessage: string = "You have unsaved changes in the plan. Do you want to discard the changes and leave the page?"


  onSaveClicked() {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(
        flatMap(expService => expService.updateTrackingPlanJson(this.originalPlanData.key, this.currentPlanData.data.toJson(), this.currentPlanData.name))).subscribe(change => {
          if (change === true) {
            this.notificationService.pushSnackBarMessage({
              message: "Saved changes in the plan."
            })
          }
        })
    )
  }

  onAddTrackerClicked() {
    const newTracker = this.currentPlanData.data.appendNewTracker();
    this.planService.selectTracker(newTracker)
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
              if (this.planService.isIdSelectedInNavSync(tracker._id) === true) {
                this.unselect()
              }
              this.changeDetector.markForCheck()
            }
          }
        })
    )
  }

  onAddTriggerClicked() {
    const newTrigger = this.currentPlanData.data.appendNewTrigger(TriggerConstants.ACTION_TYPE_LOG, TriggerConstants.CONDITION_TYPE_TIME)
    this.planService.selectLoggingTrigger(newTrigger)
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
              if (this.planService.isIdSelectedInNavSync(trigger._id) === true) {
                this.unselect()
              }
              this.changeDetector.markForCheck()
            }
          }
        })
    )
  }

  checkEventRelatedToTracker(event: BrushAndLinkingEvent, tracker: ITrackerDbEntity): boolean {
    if (event && event.obj && event.source !== 'menu') {
      switch (event.objectType) {
        case InteractivePlanObjectType.Tracker:
          return event.obj._id === tracker._id
        case InteractivePlanObjectType.Field:
          return event.obj.trackerId === tracker._id
        case InteractivePlanObjectType.Trigger:
          if (event.obj.actionType === TriggerConstants.ACTION_TYPE_REMIND) {
            return event.obj.trackers.indexOf(tracker._id) !== -1
          } else return false

      }
    } else {
      return false
    }
  }
}
