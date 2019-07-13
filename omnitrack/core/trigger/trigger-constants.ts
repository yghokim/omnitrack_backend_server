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


  static FLAG_SUNDAY = 0b1000000
  static FLAG_MONDAY = 0b0100000
  static FLAG_TUESDAY = 0b0010000
  static FLAG_WEDNESDAY = 0b0001000
  static FLAG_THURSDAY = 0b0000100
  static FLAG_FRIDAY = 0b0000010
  static FLAG_SATURDAY = 0b0000001
  static FLAGS = [
    TriggerConstants.FLAG_SUNDAY,
    TriggerConstants.FLAG_MONDAY,
    TriggerConstants.FLAG_TUESDAY,
    TriggerConstants.FLAG_WEDNESDAY,
    TriggerConstants.FLAG_THURSDAY,
    TriggerConstants.FLAG_FRIDAY,
    TriggerConstants.FLAG_SATURDAY
  ]
}