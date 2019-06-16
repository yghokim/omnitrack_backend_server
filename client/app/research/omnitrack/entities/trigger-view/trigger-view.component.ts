import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { getTrackerColorString } from '../../omnitrack-helper';
import { ITriggerDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import { TriggerConstants } from '../../../../../../omnitrack/core/trigger/trigger-constants';
import * as moment from 'moment-timezone';
import { decomposeDuration } from '../../../../../../shared_lib/utils';
import { TrackingPlanService } from '../../tracking-plan.service';

@Component({
  selector: 'app-trigger-view',
  templateUrl: './trigger-view.component.html',
  host: { 'class': 'card card-sm card-component card-entity' },
  styleUrls: ['./trigger-view.component.scss', '../entity-styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TriggerViewComponent implements OnInit {

  @Input() trigger: ITriggerDbEntity

  @Output() flagChange: EventEmitter<void> = new EventEmitter()

  constructor(public trackingPlanManager: TrackingPlanService) { }

  ngOnInit() {
  }

  getTrackerColorString(tracker: any): string {
    return getTrackerColorString(tracker)
  }

  isReminder(): boolean {
    if (this.trigger) {
      return this.trigger.actionType === TriggerConstants.ACTION_TYPE_REMIND
    } else return false
  }

  onFlagChanged(){
    this.flagChange.emit()
  }

  getTriggerTypeString(): string{
    if(this.trigger!=null){
      switch(this.trigger.conditionType){
        case TriggerConstants.CONDITION_TYPE_TIME:
        switch(this.trigger.condition.cType){
          case TriggerConstants.TIME_CONDITION_ALARM:
          return TriggerConstants.TIME_CONDITION_CODENAME_ALARM;
          case TriggerConstants.TIME_CONDITION_INTERVAL:
          return TriggerConstants.TIME_CONDITION_CODENAME_INTERVAL;
          case TriggerConstants.TIME_CONDITION_SAMPLING:
          return TriggerConstants.TIME_CONDITION_CODENAME_SAMPLING;
          default: return "Unknown"
        }

        case TriggerConstants.CONDITION_TYPE_DATA:
          return "Data-driven"
      }
    }else return null
  }

  getAlarmTimeString(hour:number, minute: number): string{
    return moment(new Date(0,0,0, hour, minute)).format("hh:mm")
  }

  getAmPm(hour:number, minute: number): string{
    return moment(new Date(0,0,0, hour, minute)).format("a")
  }

  getDecomposedDuration(durationSeconds: number): Array<{ unit: string, value: number }>{
    return decomposeDuration(durationSeconds)
  }

  getHourOfDayString(hour:number, minute:number): string{
    if(hour === 24 && minute === 0){
      return "midnight"
    } else if(hour === 12 && minute === 0){
      return "noon"
    }
    else return moment(new Date(0,0,0, hour, minute)).format("hh:mm a")
  }
}
