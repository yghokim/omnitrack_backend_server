import * as mongoose from 'mongoose';
import OTTracker from '../models/ot_tracker';
import UserBelongingCtrl from './user_belongings_base';

export default class OTTrackerCtrl extends UserBelongingCtrl {
  model = OTTracker;
}
