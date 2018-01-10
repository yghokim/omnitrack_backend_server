
export class ExperimentConstants{
  static readonly PAGE_OVERVIEW = "overview"
  static readonly PAGE_SELF_TRACKING_DATA = "tracking-data"
  static readonly PAGE_PARTICIPANTS = "participants"
  static readonly PAGE_MESSAGING = "messaging"
  
}

export interface IJoinedExperimentInfo{
  id: string
  name: string
  joinedAt: number
  droppedAt?: number
}

export class ExperimentDashboardConfigs{
  excludeWeekends?: boolean = false
  alignStartDate?: boolean = true
}

export class CollaboratorExperimentPermissions{
  allowedPages = {}
  access = {
    "userpool": false
  }

  constructor(){
    this.allowedPages[ExperimentConstants.PAGE_OVERVIEW] = true
    this.allowedPages[ExperimentConstants.PAGE_PARTICIPANTS] = true
    this.allowedPages[ExperimentConstants.PAGE_MESSAGING] = true
    this.allowedPages[ExperimentConstants.PAGE_SELF_TRACKING_DATA] = true
  }
}