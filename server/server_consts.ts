import OTTracker from './models/ot_tracker'
import OTTrigger from './models/ot_trigger'
import OTItem from './models/ot_item'

export default class ServerConstants {
  static readonly SYNC_TYPE_TRACKER = "TRACKER"
  static readonly SYNC_TYPE_TRIGGER = "TRIGGER"
  static readonly SYNC_TYPE_ITEM = "ITEM"

  static readonly TASK_POSTPROCESS_ITEM_MEDIA = "postprocess_item_media"
  static readonly TASK_PUSH_DATA = "push_command"

  static readonly TASK_BUILD_CLIENT_APP = "build_client_app"

  static readonly PUSH_DATA_TYPE_SYNC_DOWN = "sync_down"
  static readonly PUSH_DATA_TYPE_FULL_SYNC = "full_sync"
  static readonly PUSH_DATA_TYPE_PERSONAL_DATASTORE = "data_store_changed"
  static readonly PUSH_DATA_TYPE_SIGN_OUT = "sign_out"
  static readonly PUSH_DATA_TYPE_DUMP_DB = "dump_db"
  static readonly PUSH_DATA_TYPE_REFRESH_RESEARCH = "refresh_research"
  static readonly PUSH_DATA_TYPE_CLIENT_UPDATED = "update_released"
  static readonly PUSH_DATA_TYPE_EXPERIMENT_DROPPED = "experiment_dropped"
  
  static readonly PUSH_DATA_TYPE_TEST_TRIGGER_PING = "test_trigger_ping"

  static readonly PUSH_DATA_TYPE_TEXT_MESSAGE = "text_message"

  static readonly ERROR_CODE_UNCERTIFIED_Client = "ClientNotCertified"
  static readonly ERROR_CODE_ILLEGAL_ARTUMENTS = "IllegalArguments"
  static readonly ERROR_CODE_WRONG_CREDENTIAL = "CredentialWrong"
  static readonly ERROR_CODE_ILLEGAL_INVITATION_CODE = "IllegalInvitationCode"
  static readonly ERROR_CODE_USER_ALREADY_EXISTS = "UserAlreadyExists"
  static readonly ERROR_CODE_USERNAME_NOT_MATCH_RESEARCHER = "UsernameNotMatchResearcher"
  static readonly ERROR_CODE_ACCOUNT_NOT_EXISTS = "AccountNotExists"

  static readonly ERROR_CODE_INTERNAL_ERROR="InternalError"

  static readonly ERROR_CODE_TOKEN_EXPIRED = "TokenExpired"
  

  static getSyncTypeFromModel(model: any) {
    switch (model) {
      case OTTracker: return ServerConstants.SYNC_TYPE_TRACKER
      case OTTrigger: return ServerConstants.SYNC_TYPE_TRIGGER
      case OTItem: return ServerConstants.SYNC_TYPE_ITEM
    }
  }
}