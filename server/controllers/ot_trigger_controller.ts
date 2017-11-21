import * as mongoose from 'mongoose';
import OTTrigger from '../models/ot_trigger';
import UserBelongingCtrl from './user_belongings_base';

export default class OTTriggerCtrl extends UserBelongingCtrl {
  model = OTTrigger;

  attachTracker = (req, res) => {
    const userId = res.locals.user.uid
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
