import * as mongoose from 'mongoose';
import OTItem from '../models/ot_item';
import UserBelongingCtrl from './user_belongings_base';
import C from "../server_consts";

export default class OTItemCtrl extends UserBelongingCtrl {
  model = OTItem;
  syncType = C.SYNC_TYPE_ITEM
}
