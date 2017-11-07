import * as mongoose from 'mongoose';
import OTTrigger from '../models/ot_trigger';
import UserBelongingCtrl from './user_belongings_base';

export default class OTTriggerCtrl extends UserBelongingCtrl {
  model = OTTrigger;
}
