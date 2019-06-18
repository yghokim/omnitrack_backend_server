export class LoggingTriggerAction{
  notify = false
}

export class ReminderTriggerAction{
  message: string = null
  durationSeconds: number = null
  level = 0
}