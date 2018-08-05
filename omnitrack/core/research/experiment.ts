import { merge } from "../../../shared_lib/utils";


export class ExperimentConstants{
  static readonly PAGE_OVERVIEW = "overview"
  static readonly PAGE_SELF_TRACKING_DATA = "tracking-data"
  static readonly PAGE_PARTICIPANTS = "participants"
  static readonly PAGE_MESSAGING = "messaging"
  static readonly PAGE_INVITATIONS = "invitations"
  static readonly PAGE_GROUPS = "groups"
  static readonly PAGE_CONSENT = "consent"
  static readonly PAGE_OMNITRACK = "omnitrack"
  static readonly PAGE_SETTINGS = "settings"
  static readonly PAGE_DETAILED_OVERVIEW = "detailed-overview"
  static readonly PAGE_CUSTOM_STATISTICS = "custom-statistics"
  static readonly PAGE_CLIENT_SETTINGS = "client-apps"
  
}

export type ExampleExperimentInfo = {
  key: string,
  name: string,
  description: string
}

export interface IJoinedExperimentInfo{
  id: string
  name: string
  joinedAt: number
  droppedAt?: number
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
    this.allowedPages[ExperimentConstants.PAGE_CONSENT] = true
    this.allowedPages[ExperimentConstants.PAGE_INVITATIONS] = true
    this.allowedPages[ExperimentConstants.PAGE_DETAILED_OVERVIEW] = true
    this.allowedPages[ExperimentConstants.PAGE_CUSTOM_STATISTICS] = true
    this.allowedPages[ExperimentConstants.PAGE_CLIENT_SETTINGS] = true
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