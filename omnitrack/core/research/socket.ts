export class SocketConstants{

  static readonly SERVER_EVENT_RESET = "server/reset"

  static readonly SERVER_EVENT_SUBSCRIBE_SERVER_GLOBAL = "subscribe/global"

  static readonly SERVER_EVENT_UNSUBSCRIBE_SERVER_GLOBAL = "unsubscribe/global"

  static readonly SERVER_EVENT_UPDATED_GLOBAL = "update/server"

  static readonly SERVER_EVENT_SUBSCRIBE_RESEARCHER = "subscribe/researcher"
  static readonly SERVER_EVENT_UNSUBSCRIBE_RESEARCHER = "unsubscribe/researcher"
  static readonly SERVER_EVENT_SUBSCRIBE_EXPERIMENT = "subscribe/researcher"
  static readonly SERVER_EVENT_UNSUBSCRIBE_EXPERIMENT = "unsubscribe/researcher" 

  static readonly SERVER_EVENT_RESUBSCRIBE_PARTICIPANT_TRACKING_DATA = "reinitialize/participants" 
  static readonly SERVER_EVENT_UNSUBSCRIBE_PARTICIPANT_TRACKING_DATA = "reinitialize/participants" 
  

  static readonly SOCKET_MESSAGE_UPDATED_EXPERIMENT = "updated/experiment"
  
  static readonly SOCKET_MESSAGE_UPDATED_RESEARCHER = "updated/researcher"

  static readonly SOCKET_MESSAGE_UPDATED_TRACKERS = "updated/trackers"
  static readonly SOCKET_MESSAGE_UPDATED_ITEMS = "updated/items"
  static readonly SOCKET_MESSAGE_UPDATED_TRIGGERS = "updated/triggers"

  
  static readonly MODEL_INVITATION = "OTInvitation"
  static readonly MODEL_PARTICIPANT = "OTParticipant"
  static readonly MODEL_EXPERIMENT = "OTExperiment"
  static readonly MODEL_USER = "OTUser"
  static readonly MODEL_RESEARCHER = "OTResearcher"
  static readonly MODEL_TRACKER = "OTTracker"
  static readonly MODEL_TRIGGER = "OTTrigger"
  static readonly MODEL_ITEM = "OTItem"
  
  static readonly EVENT_APPROVED = "approved"
  static readonly EVENT_DENIED = "denied"
  static readonly EVENT_REMOVED = "removed"
  static readonly EVENT_DROPPED = "dropped"
  static readonly EVENT_ADDED = "added"
  static readonly EVENT_EDITED = "edited"
  static readonly EVENT_INVITED = "invited"
  static readonly EVENT_PERMISSION_CHANGED = "permission_changed"
}

export interface UpdateInfo{
  model: string,
  event: string,
  payload?: any
}