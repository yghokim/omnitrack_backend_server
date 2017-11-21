export default class ServerConstants{
  static readonly SYNC_TYPE_TRACKER = "TRACKER"
  static readonly SYNC_TYPE_TRIGGER = "TRIGGER"
  static readonly SYNC_TYPE_ITEM = "ITEM"

  static readonly TASK_POSTPROCESS_ITEM_MEDIA = "postprocess_item_media"
  static readonly TASK_PUSH_SYNCHRONIZATION = "push_synchronization"

  static readonly PUSH_DATA_TYPE_SYNC_DOWN = "kr.ac.snu.hcil.omnitrack.messaging.sync_down"
  static readonly PUSH_DATA_TYPE_FULL_SYNC = "kr.ac.snu.hcil.omnitrack.messaging.full_sync"
}