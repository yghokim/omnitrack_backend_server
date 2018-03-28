import * as mongoose from 'mongoose';
import app from '../app';
import OTItem from '../models/ot_item';
import UserBelongingCtrl from './user_belongings_base';
import C from "../server_consts";
import { Request, Response } from 'express';
import { IItemDbEntity } from '../../omnitrack/core/db-entity-types';
import { deepclone } from '../../shared_lib/utils';

export default class OTItemCtrl extends UserBelongingCtrl {
  model = OTItem;
  syncType = C.SYNC_TYPE_ITEM

  getAllOfTracker = (req: Request, res: Response) => {
    OTItem.find({ user: res.locals.user.uid, tracker: req.params.trackerId }).then(
      items => {
        if (items != null) {
          res.status(200).send(items)
        } else { res.status(200).send([]) }
      }
    ).catch(err => {
      res.status(404).send({ error: err })
    })
  }
  //dataTable: [{_id: false, attrLocalId: String, sVal: String}],
  setItemValue(itemQuery: any, attrLocalId: string, serializedValue: string): Promise<{ success: boolean, error?: any, changedItem?: IItemDbEntity }> {
    const itemQueryCopy = deepclone(itemQuery)
    itemQueryCopy["dataTable.attrLocalId"] = attrLocalId
    return OTItem.findOneAndUpdate(itemQueryCopy, { $set: { "dataTable.$.sVal": serializedValue } }, { new: true }).then(
      updatedItem => {
        if (updatedItem) {
          app.serverModule().registerMessageDataPush(updatedItem["user"], app.pushModule().makeSyncMessageFromTypes([C.SYNC_TYPE_ITEM]))

          return { success: true, error: null, changedItem: updatedItem as any }
        } else {
          return { success: false, error: "Item Not Found" }
        }
      }
    ).catch(err => {
      return { success: false, error: err, changedItem: null }
    })
  }

  postItemValue = (req, res) => {
    const attrLocalId = req.body.attrLocalId
    const itemQuery = req.body.itemQuery
    const serializedValue = req.body.serializedValue

    console.log("attrLocalId: " + attrLocalId)
    console.log("itemQuery: " + JSON.stringify(itemQuery))
    console.log("serializedValue: " + serializedValue)

    if (!attrLocalId || !itemQuery || !serializedValue) {
      res.status(404).send({ success: false, error: "IllegalParameters" })
      return
    }

    //check previlages
    if (res.locals.user) {
      //on user mode, be sure that the item belongs to the user.
      itemQuery["user"] = res.locals.user.uid
    }

    this.setItemValue(itemQuery, attrLocalId, serializedValue).then(
      result => {
        console.log(result)
        res.status(200).send(result)
      }
    ).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }
}

export const itemCtrl = new OTItemCtrl()