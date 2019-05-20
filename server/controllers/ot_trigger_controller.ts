import * as mongoose from 'mongoose';
import OTTrigger from '../models/ot_trigger';
import UserBelongingCtrl from './user_belongings_base';
import C from '../server_consts'

export default class OTTriggerCtrl extends UserBelongingCtrl {
  model = OTTrigger;
  syncType = C.SYNC_TYPE_TRIGGER

  attachTracker = (req, res) => {
    const userId = req.user.uid
    const triggerId = req.params.triggerId
    const trackerId = req.query.trackerId
    req.app["omnitrack"].commandModule.addTrackerToTrigger(triggerId, trackerId, userId)
      .then((changed) => {
        res.status(200).send(changed)
      })
      .catch(err => {
        res.status(500).send(err)
      })
  }
}
