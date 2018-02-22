import * as mongoose from 'mongoose';
import OTItem from '../models/ot_item';
import UserBelongingCtrl from './user_belongings_base';
import C from "../server_consts";
import { Request, Response } from 'express';

export default class OTItemCtrl extends UserBelongingCtrl {
  model = OTItem;
  syncType = C.SYNC_TYPE_ITEM

  getAllOfTracker = (req: Request, res: Response) => {
    OTItem.find({ user: res.locals.user.uid, tracker: req.params.trackerId}).then(
      items => {
        if (items != null) {
          res.status(200).send(items)
        } else { res.status(200).send([]) }
      }
    ).catch(err => {
      res.status(404).send({error: err})
    })
  }
}
