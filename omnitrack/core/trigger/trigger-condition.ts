import { TriggerConstants } from "./trigger-constants";

export enum DataComparison{
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
  factory: [string, any] = null
  comparison = DataComparison.Exceed
  query: any
  threshold = 0
}