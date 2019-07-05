import attrType from '../fields/field-types';
import { TriggerConstants } from "./trigger-constants";
import { OTTimeQuery } from '../value-connection/value-connection'
import { IFactoryMeasure, OTItemMetadataMeasureFactory, OTTimePointMetadataMeasureFactory } from "../value-connection/measure-factory";
import TypedStringSerializer from '../typed_string_serializer';
import { IFieldDbEntity } from '../db-entity-types';
import { TrackingPlan } from '../tracking-plan';

export enum DataComparison {
  Exceed = "exceed",
  Drop = "drop"
}

export class TimeCondition {
  cType = TriggerConstants.TIME_CONDITION_ALARM
  aHr = 17
  aMin = 0

  iSec = 60
  iStartHr = 9
  iEndHr = 24
  iRanged = false

  esmStartHr = 9
  esmEndHr = 23
  esmCount = 10
  esmIntervalSec = 60 * 30
  esmRanged = false

  repeat = true
  dow = 0b1111111
  endAt: number = null
}

export class DataDrivenCondition {
  measure: IFactoryMeasure = null
  comparison = DataComparison.Exceed
  query: OTTimeQuery = null
  threshold = 0
}

function isDataDrivenTriggerFactoryAttachableTo(field: IFieldDbEntity, plan: TrackingPlan): boolean {
  return plan.triggers.find(tr => tr.trackers.indexOf(field.trackerId) !== -1 && tr.conditionType === TriggerConstants.CONDITION_TYPE_DATA) != null
}

export class OTDataDrivenConditionMetValueMeasureFactory extends OTItemMetadataMeasureFactory {

  name: string = "Condition-Met Value"
  description: string = "The measured value that was first measured when a data-driven condition was met"
  dataTypeName: string = TypedStringSerializer.TYPENAME_BIGDECIMAL
  categoryName: string = "Data-Driven Triggers/Reminders"
  attributeType: number = attrType.ATTR_TYPE_NUMBER

  constructor() {
    super("dataDrivenConditionMetValue")
  }

  isAttachableTo(field: IFieldDbEntity, plan: TrackingPlan): boolean {
    return isDataDrivenTriggerFactoryAttachableTo(field, plan)
  }
}

export class OTDataDrivenConditionMetTimeMeasureFactory extends OTTimePointMetadataMeasureFactory {

  name: string = "Condition-Met Time"
  description: string = "The time when a data-driven condition was met"
  categoryName: string = "Data-Driven Triggers/Reminders"

  constructor() {
    super("dataDrivenConditionMetTime")
  }

  isAttachableTo(field: IFieldDbEntity, plan: TrackingPlan): boolean {
    return isDataDrivenTriggerFactoryAttachableTo(field, plan)
  }
}

