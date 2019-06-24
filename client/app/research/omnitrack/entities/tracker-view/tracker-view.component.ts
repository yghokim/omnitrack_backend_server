import { Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectionStrategy, Input } from '@angular/core';
import { ITrackerDbEntity, ITriggerDbEntity, IFieldDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import { getTrackerColorString, getFieldIconName } from '../../omnitrack-helper';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { TrackingPlanService } from '../../tracking-plan.service';

@Component({
  selector: 'app-tracker-view',
  templateUrl: './tracker-view.component.html',
  host: { 'class': 'card card-sm card-component card-entity' },
  styleUrls: ['./tracker-view.component.scss', '../entity-styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackerViewComponent implements OnInit {

  private readonly _internalSubscriptions = new Subscription()

  public tracker: ITrackerDbEntity
  @Input("tracker") set _tracker(tracker: ITrackerDbEntity) {
    this.tracker = tracker
    this.reminders = this.trackingPlanManager.getRemindersOf(tracker)
  }

  @Output() trackerChange: EventEmitter<void> = new EventEmitter()

  reminders: Array<ITriggerDbEntity>

  constructor(private dialog: MatDialog, public trackingPlanManager: TrackingPlanService) { }

  ngOnInit() {

  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  getTrackerColorString(tracker: any): string {
    return getTrackerColorString(tracker)
  }

  onFlagChanged() {
    this.trackerChange.emit()
  }

  getFieldIconName(attr: IFieldDbEntity): string {
    return getFieldIconName(attr)
  }

}
