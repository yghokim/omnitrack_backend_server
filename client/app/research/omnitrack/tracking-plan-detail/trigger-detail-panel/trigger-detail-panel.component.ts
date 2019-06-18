import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { ITriggerDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import { TriggerConstants } from '../../../../../../omnitrack/core/trigger/trigger-constants';
import { TimeCondition } from '../../../../../../omnitrack/core/trigger/trigger-condition';
import { merge } from '../../../../../../shared_lib/utils';
import * as moment from 'moment';

@Component({
  selector: 'app-trigger-detail-panel',
  templateUrl: './trigger-detail-panel.component.html',
  styleUrls: ['./trigger-detail-panel.component.scss', '../tracking-plan-detail.component.scss']
})
export class TriggerDetailPanelComponent implements OnInit {
  private _trigger: ITriggerDbEntity

  get esmIntervalDigit(): number {
    return this.getNearestTimeUnitValue(this.trigger.condition.esmIntervalSec).digit
  }
  set esmIntervalDigit(digit: number) {
    this.trigger.condition.esmIntervalSec = this.convertToSeconds(digit, this.esmIntervalUnit)
  }

  get esmIntervalUnit(): string {
    return this.getNearestTimeUnitValue(this.trigger.condition.esmIntervalSec).unit
  }
  set esmIntervalUnit(unit: string) {
    this.trigger.condition.esmIntervalSec = this.convertToSeconds(this.esmIntervalDigit, unit)
  }

  @Input()
  set trigger(trigger: ITriggerDbEntity) {
    this._trigger = trigger
  }

  get trigger(): ITriggerDbEntity {
    return this._trigger
  }

  get entityType(): string {
    switch (this.trigger.actionType) {
      case TriggerConstants.ACTION_TYPE_LOG: return "trigger"
      case TriggerConstants.ACTION_TYPE_REMIND: return "reminder"
    }
  }

  ngOnInit() {
  }

  onTimeConditionTypeChanged(cType: number) {
    this.trigger.condition.cType = cType
    this.trigger.condition = merge(new TimeCondition(), this.trigger.condition, true, true)
  }

  getNextDay(): Date {
    return moment().add(1, 'day').startOf('day').toDate()
  }

  getEndDate(): Date {
    return new Date(this.trigger.condition.endAt)
  }

  getNearestTimeUnitValue(seconds: number): { unit: string, digit: number } {
    if (seconds % 3600 === 0) {
      return {
        digit: seconds / 3600,
        unit: 'hour'
      }
    } else if (seconds % 60 === 0) {
      return {
        digit: seconds / 60,
        unit: 'minute'
      }
    } else return {
      digit: seconds,
      unit: 'second'
    }
  }

  convertToSeconds(digit: number, unit: string): number {
    switch (unit) {
      case 'second': return digit;
      case 'minute': return digit * 60;
      case 'hour': return digit * 3600;
    }
  }
  
  get intervalDuration(): {hour: number, minute: number, second: number}
  {
    const full = this.trigger.condition.iSec
    const hour = Math.floor(full/3600)
    const minute = Math.floor((full - hour * 3600)/60)
    const second = full%60
    return {hour: hour, minute: minute, second: second}
  }

  get intervalDurationHour(): number{
    return this.intervalDuration.hour
  }
  get intervalDurationMinute(): number{
    return this.intervalDuration.minute
  }
  get intervalDurationSecond(): number{
    return this.intervalDuration.second
  }

  set intervalDurationHour(hour: number){
    const original = this.intervalDuration
    original.hour = hour
    this.trigger.condition.iSec = original.hour * 3600 + original.minute * 60 + original.second
  }

  set intervalDurationMinute(minute: number){
    const original = this.intervalDuration
    original.minute = minute
    this.trigger.condition.iSec = original.hour * 3600 + original.minute * 60 + original.second
  }

  set intervalDurationSecond(second: number){
    const original = this.intervalDuration
    original.second = second
    this.trigger.condition.iSec = original.hour * 3600 + original.minute * 60 + original.second
  }

}