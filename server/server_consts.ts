export default class ServerConstants {
  static readonly SYNC_TYPE_TRACKER = "TRACKER"
  static readonly SYNC_TYPE_TRIGGER = "TRIGGER"
  static readonly SYNC_TYPE_ITEM = "ITEM"

  static readonly TASK_POSTPROCESS_ITEM_MEDIA = "postprocess_item_media"
  static readonly TASK_PUSH_DATA = "push_command"

  static readonly PUSH_DATA_TYPE_SYNC_DOWN = "sync_down"
  static readonly PUSH_DATA_TYPE_FULL_SYNC = "full_sync"
  static readonly PUSH_DATA_TYPE_SIGN_OUT = "sign_out"
  static readonly PUSH_DATA_TYPE_DUMP_DB = "dump_db"

}