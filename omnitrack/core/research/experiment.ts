import { merge } from "../../../server/utils";


export class ExperimentConstants{
  static readonly PAGE_OVERVIEW = "overview"
  static readonly PAGE_SELF_TRACKING_DATA = "tracking-data"
  static readonly PAGE_PARTICIPANTS = "participants"
  static readonly PAGE_MESSAGING = "messaging"
  static readonly PAGE_INVITATIONS = "invitations"
  static readonly PAGE_GROUPS = "groups"
  static readonly PAGE_OMNITRACK = "omnitrack"
  static readonly PAGE_SETTINGS = "settings"
  
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

export class ExperimentPermissions{
  allowedPages = {}
  access = {
    "userPool": true,
    "manageCollaborators": true,
    groups: {
      creation: true,
      edition: true,
      deletion: true,
    }
  }

  constructor(){
    this.allowedPages[ExperimentConstants.PAGE_OVERVIEW] = true
    this.allowedPages[ExperimentConstants.PAGE_PARTICIPANTS] = true
    this.allowedPages[ExperimentConstants.PAGE_MESSAGING] = true
    this.allowedPages[ExperimentConstants.PAGE_SELF_TRACKING_DATA] = true
    this.allowedPages[ExperimentConstants.PAGE_SETTINGS] = true
    this.allowedPages[ExperimentConstants.PAGE_GROUPS] = true
    this.allowedPages[ExperimentConstants.PAGE_OMNITRACK] = true
    this.allowedPages[ExperimentConstants.PAGE_INVITATIONS] = true
  }

  static fromJson(json: any): ExperimentPermissions{
    return merge(ExperimentPermissions.makeCollaboratorDefaultPermissions(), json, true, true)
  }

  static makeCollaboratorDefaultPermissions(): ExperimentPermissions{
    const permissions = new ExperimentPermissions()
    permissions.access.userPool = false
    permissions.access.manageCollaborators = false

    return permissions
  }

  static makeMasterPermissions(): ExperimentPermissions{
    return new ExperimentPermissions()
  }
}