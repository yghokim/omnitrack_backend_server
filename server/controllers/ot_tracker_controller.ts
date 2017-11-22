import * as mongoose from 'mongoose';
import OTTracker from '../models/ot_tracker';
import UserBelongingCtrl from './user_belongings_base';
import C from '../server_consts'

export default class OTTrackerCtrl extends UserBelongingCtrl {
  model = OTTracker;
  syncType = C.SYNC_TYPE_TRACKER
}
