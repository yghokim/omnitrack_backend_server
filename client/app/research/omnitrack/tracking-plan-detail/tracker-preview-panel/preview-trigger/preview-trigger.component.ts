import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter, AfterContentChecked } from '@angular/core';
import { ITriggerDbEntity } from '../../../../../../../omnitrack/core/db-entity-types';
import { TriggerConstants } from '../../../../../../../omnitrack/core/trigger/trigger-constants';
import { ResizedEvent } from 'angular-resize-event';
import * as moment from 'moment';
import { ifelse } from '../../../../../../../shared_lib/utils';
import { MeasureFactoryManager } from '../../../../../../../omnitrack/core/value-connection/measure-factory.manager';
import { AMeasureFactory } from '../../../../../../../omnitrack/core/value-connection/measure-factory';

export enum EConnectorType {
  Main, Script
}

export interface ConnectorPoint {
  x: number,
  y: number,
  type: EConnectorType
}

@Component({
  selector: 'app-preview-trigger',
  templateUrl: './preview-trigger.component.html',
  styleUrls: ['./preview-trigger.component.scss']
})
export class PreviewTriggerComponent implements OnInit, AfterContentChecked {


  @Input()
  trigger: ITriggerDbEntity

  @Output()
  onConnectorPositionChanged = new EventEmitter<Array<ConnectorPoint>>()

  private _connectorPoints: Array<ConnectorPoint>

  get connectorPoints(): Array<ConnectorPoint> {
    return this._connectorPoints
  }

  @ViewChild("connector_main")
  mainConnectorPointRef: ElementRef

  @ViewChild("connector_script")
  scriptConnectorPointRef: ElementRef

  constructor(private elementRef: ElementRef) { }

  ngOnInit() {
  }

  ngAfterContentChecked() {
    this.refreshConnectorPoints()
  }

  get typeName(): string {
    if (this.trigger) {
      switch (this.trigger.actionType) {
        case TriggerConstants.ACTION_TYPE_LOG:
          return "Background Logging Trigger"
        case TriggerConstants.ACTION_TYPE_REMIND:
          return "Reminder"
      }
    } else return null
  }

  get mainConnectorName(): string {
    if (this.trigger) {
      switch (this.trigger.actionType) {
        case TriggerConstants.ACTION_TYPE_LOG:
          return "automatically logs"
        case TriggerConstants.ACTION_TYPE_REMIND:
          return "reminds"
      }
    } else return null
  }

  refreshConnectorPoints() {

    const triggerPositionX = this.elementRef.nativeElement.offsetLeft
    const triggerPositionY = this.elementRef.nativeElement.offsetTop

    const mainConnectorPointLeft = this.mainConnectorPointRef.nativeElement.offsetLeft
    const mainConnectorPointTop = this.mainConnectorPointRef.nativeElement.offsetTop
    const scriptConnectorPointLeft = this.scriptConnectorPointRef.nativeElement.offsetLeft
    const scriptConnectorPointTop = this.scriptConnectorPointRef.nativeElement.offsetTop

    this._connectorPoints = [
      {
        x: mainConnectorPointLeft + this.mainConnectorPointRef.nativeElement.offsetWidth * .5,
        y: mainConnectorPointTop + this.mainConnectorPointRef.nativeElement.offsetHeight * .5,
        type: EConnectorType.Main
      },
      {
        x: scriptConnectorPointLeft + this.scriptConnectorPointRef.nativeElement.offsetWidth * .5,
        y: scriptConnectorPointTop + this.scriptConnectorPointRef.nativeElement.offsetHeight * .5,
        type: EConnectorType.Script
      },
    ]

    this._connectorPoints.forEach(p => {
      p.x += triggerPositionX
      p.y += triggerPositionY
    })

    this.onConnectorPositionChanged.emit(this._connectorPoints)
  }

  //trigger display
  getDaysOfWeekString(): string {
    if (this.trigger.condition.dow === 0b1111111) {
      return "Everyday"
    } else return TriggerConstants.FLAGS.map(
      (flag, index) => {
        const checked = (this.trigger.condition.dow & flag) !== 0
        if (checked === true) {
          return moment().day(index).format("ddd")
        } else {
          return null
        }
      }
    ).filter(d => d != null).join(", ")
  }

  getAlarmTime(): string {
    return moment().hour(this.trigger.condition.aHr).minute(this.trigger.condition.aMin).format("hh:mm")
  }

  getAlarmAmPm(): string {
    return moment().hour(this.trigger.condition.aHr).minute(this.trigger.condition.aMin).format("a")
  }

  getSamplingRangeText(): string {
    if (this.trigger.condition.esmStartHr === this.trigger.condition.esmEndHr || this.trigger.condition.esmRanged === false) {
      return "Whole day"
    } else {
      const from = moment().hour(this.trigger.condition.esmStartHr).format("HH:00 a")
      let to = moment().hour(this.trigger.condition.esmEndHr).format("HH:00 a")

      if (this.trigger.condition.esmStartHr > this.trigger.condition.esmEndHr) {
        return from + " - " + to + " next day"
      } else return from + " - " + to

    }
  }

  getIntervalRangeText(): string {
    if (this.trigger.condition.iStartHr === this.trigger.condition.iEndHr || this.trigger.condition.iRanged === false) {
      return "Whole day"
    } else {
      const from = ifelse(() => {
        if (this.trigger.condition.iStartHr === 24) {
          return "24:00"
        } else return moment().hour(this.trigger.condition.iStartHr).format("HH:00 a")
      })

      const to = ifelse(() => {
        if (this.trigger.condition.iEndHr === 24) {
          return "24:00"
        } else return moment().hour(this.trigger.condition.EndHr).format("HH:00 a")
      })

      if (this.trigger.condition.iStartHr > this.trigger.condition.iEndHr) {
        return from + " - " + to + " next day"
      } else return from + " - " + to

    }
  }

  getIntervalBreakdown(): { hour: number, minute: number, second: number } {
    const full = this.trigger.condition.iSec
    const hour = Math.floor(full / 3600)
    const minute = Math.floor((full - hour * 3600) / 60)
    const second = full % 60
    return { hour: hour, minute: minute, second: second }
  }

  getMeasureFactory(): AMeasureFactory {
    if (this.trigger.condition.measure) {
      const measureFactory = MeasureFactoryManager.getMeasureFactoryByCode(this.trigger.condition.measure.code)
      return measureFactory
    } else return null
  }
}

