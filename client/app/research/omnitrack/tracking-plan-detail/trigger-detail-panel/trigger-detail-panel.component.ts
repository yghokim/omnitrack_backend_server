import { Component, OnInit, Input, ViewChild, ElementRef, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ITriggerDbEntity, ITrackerDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import { TriggerConstants } from '../../../../../../omnitrack/core/trigger/trigger-constants';
import { TimeCondition, DataDrivenCondition } from '../../../../../../omnitrack/core/trigger/trigger-condition';
import { merge } from '../../../../../../shared_lib/utils';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { TrackingPlanService } from '../../tracking-plan.service';
import { MatBottomSheet } from '@angular/material';
import { TrackerPickerComponent } from '../tracker-picker/tracker-picker.component';
import { AMeasureFactory, IFactoryMeasure } from '../../../../../../omnitrack/core/value-connection/measure-factory';
import { MeasureFactoryManager } from '../../../../../../omnitrack/core/value-connection/measure-factory.manager';
import { ServiceManager } from '../../../../../../omnitrack/core/external-services/external-service.manager';
import TypedStringSerializer from '../../../../../../omnitrack/core/typed_string_serializer';

@Component({
  selector: 'app-trigger-detail-panel',
  templateUrl: './trigger-detail-panel.component.html',
  styleUrls: ['./trigger-detail-panel.component.scss', '../tracking-plan-detail.component.scss']
})
export class TriggerDetailPanelComponent implements OnInit, OnDestroy {
  private _trigger: ITriggerDbEntity

  private _internalSubscriptions = new Subscription()

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

  constructor(private changeDetector: ChangeDetectorRef, private planService: TrackingPlanService, private matBottomSheet: MatBottomSheet) {

  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  get triggerConditionType(): number {
    return this.trigger.conditionType
  }

  set triggerConditionType(type: number) {
    if (this.trigger.conditionType != type && type != null) {
      this.trigger.conditionType = type
      let defaultCondition
      switch (type) {
        case TriggerConstants.CONDITION_TYPE_TIME:
          defaultCondition = new TimeCondition()
          break;
        case TriggerConstants.CONDITION_TYPE_DATA:
          defaultCondition = new DataDrivenCondition()
          break;
      }
      this.trigger.condition = merge(defaultCondition, this.trigger.condition, true, true)
    }
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
    } else {
      return {
        digit: seconds,
        unit: 'second'
      }
    }
  }

  convertToSeconds(digit: number, unit: string): number {
    switch (unit) {
      case 'second': return digit;
      case 'minute': return digit * 60;
      case 'hour': return digit * 3600;
    }
  }

  get intervalDuration(): { hour: number, minute: number, second: number } {
    const full = this.trigger.condition.iSec
    const hour = Math.floor(full / 3600)
    const minute = Math.floor((full - hour * 3600) / 60)
    const second = full % 60
    return { hour: hour, minute: minute, second: second }
  }

  get intervalDurationHour(): number {
    return this.intervalDuration.hour
  }
  get intervalDurationMinute(): number {
    return this.intervalDuration.minute
  }
  get intervalDurationSecond(): number {
    return this.intervalDuration.second
  }

  set intervalDurationHour(hour: number) {
    const original = this.intervalDuration
    original.hour = hour
    this.trigger.condition.iSec = original.hour * 3600 + original.minute * 60 + original.second
  }

  set intervalDurationMinute(minute: number) {
    const original = this.intervalDuration
    original.minute = minute
    this.trigger.condition.iSec = original.hour * 3600 + original.minute * 60 + original.second
  }

  set intervalDurationSecond(second: number) {
    const original = this.intervalDuration
    original.second = second
    this.trigger.condition.iSec = original.hour * 3600 + original.minute * 60 + original.second
  }

  get attachableMeasureFactories(): Array<AMeasureFactory> {
    return ServiceManager.measureFactories.filter(f => f.isDemandingUserInput !== true && TypedStringSerializer.isNumeric(f.dataTypeName))
  }

  get attachedMeasureFactory(): AMeasureFactory {
    if (this.trigger.condition.measure && this.trigger.condition.measure.code) {
      return MeasureFactoryManager.getMeasureFactoryByCode(this.trigger.condition.measure.code)
    } else return null
  }

  set attachedMeasureFactory(factory: AMeasureFactory) {
    if (factory) {
      if (this.trigger.condition.measure) {
        this.trigger.condition.measure.code = factory.code
      } else {
        this.trigger.condition.measure = {
          code: factory.code,
          args: null
        } as IFactoryMeasure
      }
    } else {
      this.trigger.condition.measure = null
    }
  }

  getTrackerById(id: string): ITrackerDbEntity {
    return this.planService.getTracker(id)
  }

  getAssignableTrackers(): Array<ITrackerDbEntity> {
    return this.planService.currentPlan.trackers.filter(t =>
      this.trigger.trackers != null ? (this.trigger.trackers.indexOf(t._id) === -1) : true)
  }

  onAssignNewTrackerClicked() {
    this._internalSubscriptions.add(
      this.matBottomSheet.open(TrackerPickerComponent, {
        data: {
          trackers: this.getAssignableTrackers()
        },
        panelClass: "no-padding"
      }).afterDismissed().subscribe(
        tracker => {
          console.log("push ", tracker)
          if (tracker) {
            if (this.trigger.trackers) {
              this.trigger.trackers.push(tracker._id)
            } else {
              this.trigger.trackers = [tracker._id]
            }
            this.changeDetector.markForCheck()
          }
        }
      )
    )
  }

  onTrackerRemoveClicked(trackerId: string) {
    const index = this.trigger.trackers.indexOf(trackerId)
    if (index !== -1) {
      this.trigger.trackers.splice(index, 1)
      this.changeDetector.markForCheck()
    }
  }
}
