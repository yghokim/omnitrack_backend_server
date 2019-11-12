import { trigger, transition, style, animate } from "@angular/animations";
import { IFieldDbEntity, ITrackerDbEntity, ITriggerDbEntity } from '../../../../omnitrack/core/db-entity-types';
import FieldManager from "../../../../omnitrack/core/fields/field.manager";
import { TriggerConstants } from "../../../../omnitrack/core/trigger/trigger-constants";
import * as moment from "moment";
import { ServiceManager } from "../../../../omnitrack/core/external-services/external-service.manager";
import { DataComparison } from "../../../../omnitrack/core/trigger/trigger-condition";

export function getTrackerColorString(tracker: ITrackerDbEntity): string {
  const colorInt = tracker.color
  if (colorInt) {
    const alpha = (colorInt >> 24) & 0xFF
    const red = (colorInt >> 16) & 0xFF
    const green = (colorInt >> 8) & 0xFF
    const blue = (colorInt) & 0xFF
    return "rgba(" + red + "," + green + "," + blue + "," + (alpha / 255) + ")"
  } else { return "transparent" }
}


export function getFieldIconName(attr: IFieldDbEntity): string {
  const helper = FieldManager.getHelper(attr.type)
  if (helper != null) {
    return helper.getSmallIconType(attr)
  } else { return null }
}

export function makeShortenConditionString(trigger: ITriggerDbEntity): string {
  switch (trigger.conditionType) {
    case TriggerConstants.CONDITION_TYPE_TIME:
      switch (trigger.condition.cType) {
        case TriggerConstants.TIME_CONDITION_ALARM:
          return "Alarm (" + makeAlarmTimeString(trigger.condition.aHr, trigger.condition.aMin) + ")"
        case TriggerConstants.TIME_CONDITION_INTERVAL:
          return "Interval (every " + trigger.condition.iSec + " secs)"
        case TriggerConstants.TIME_CONDITION_SAMPLING:
          return "Sampling (" + trigger.condition.esmCount + " pings)"
      }
      break;
    case TriggerConstants.CONDITION_TYPE_DATA:
      if (trigger.condition.measure && trigger.condition.measure.code) {
        const factory = ServiceManager.getFactoryByCode(trigger.condition.measure.code)
        if (factory != null) {
          let comparisonSymbol
          switch (trigger.condition.comparison as DataComparison) {
            case DataComparison.Exceed:
              comparisonSymbol = ">"
              break;
            case DataComparison.Drop:
              comparisonSymbol = "<"
              break;
          }
          return factory.name + " (" + factory.categoryName + ") " + comparisonSymbol + " " + trigger.condition.threshold
        }
      } else return "Data-driven"
      break;
  }
}

function makeAlarmTimeString(hr: number, min: number): string {
  return moment().hour(hr).minute(min).format("hh:mm a")
}


export function generateRowTriggerAnimation(name: string = "rowShowHideTrigger"): any {
  trigger(name || 'rowShowHideTrigger', [
    transition(':enter', [
      style({ opacity: 0, transform: "translate(0,100%)" }),
      animate('0.5s ease-out', style({ opacity: 1, transform: "translate(0,0)" })),
    ]),
    transition(':leave', [
      animate('0.3s ease-out', style({ opacity: 0, height: 0 }))
    ])
  ])
}

export function generateAlphaEnterLeaveTriggerAnim(name: string = "enterLeaveTrigger"): any {
  trigger(name || 'enterLeaveTrigger', [
    transition(':enter', [
      style({ opacity: 0 }),
      animate('0.5s ease-out', style({ opacity: 1 })),
    ]),
    transition(':leave', [
      animate('0.3s ease-out', style({ opacity: 0 }))
    ])
  ])
}