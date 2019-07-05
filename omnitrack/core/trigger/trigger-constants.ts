export class TriggerConstants {
  static readonly CONDITION_TYPE_TIME = 0
  static readonly CONDITION_TYPE_DATA = 1
  static readonly CONDITION_TYPE_EVENT = 2

  static readonly ACTION_TYPE_REMIND = 0
  static readonly ACTION_TYPE_LOG = 1

  static readonly TIME_CONDITION_ALARM = 0
  static readonly TIME_CONDITION_INTERVAL = 1
  static readonly TIME_CONDITION_SAMPLING = 2
  static readonly TIME_CONDITION_CODENAME_ALARM = "alarm"
  static readonly TIME_CONDITION_CODENAME_INTERVAL = "interval"
  static readonly TIME_CONDITION_CODENAME_SAMPLING = "sampling"
}