import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { getTrackerColorString } from '../../omnitrack-helper';
import { ITriggerDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import { TriggerConstants } from '../../../../../../omnitrack/core/trigger-constants';

@Component({
  selector: 'app-trigger-view',
  templateUrl: './trigger-view.component.html',
  host: { 'class': 'card card-sm card-component card-entity' },
  styleUrls: ['./trigger-view.component.scss', '../entity-styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TriggerViewComponent implements OnInit {

  @Input() trigger: ITriggerDbEntity

  @Input() trackingPackage: any

  @Output() flagChange: EventEmitter<void> = new EventEmitter()

  constructor() { }

  ngOnInit() {
  }

  getTrackerColorString(tracker: any): string {
    return getTrackerColorString(tracker)
  }

  findTracker(pack, trackerId) {
    return pack.data.trackers.find(tracker => tracker.objectId === trackerId)
  }

  isReminder(): boolean {
    if (this.trigger) {
      return this.trigger.actionType === TriggerConstants.ACTION_TYPE_REMIND
    } else return false
  }

  onFlagChanged(){
    this.flagChange.emit()
  }

  getTimeTriggerTypeString(timeConditionType: number): string{
    switch(timeConditionType){
      case TriggerConstants.TIME_CONDITION_ALARM:
      return TriggerConstants.TIME_CONDITION_CODENAME_ALARM;
      case TriggerConstants.TIME_CONDITION_INTERVAL:
      return TriggerConstants.TIME_CONDITION_CODENAME_INTERVAL;
      case TriggerConstants.TIME_CONDITION_SAMPLING:
      return TriggerConstants.TIME_CONDITION_CODENAME_SAMPLING;
      default: return "Unknown"
    }
  }

}
