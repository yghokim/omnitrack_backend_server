import BaseCtrl from './base';
import * as mongoose from 'mongoose';
import OTUser from '../models/ot_user';
import OTUsageLog from '../models/ot_usage_log';

export default class OTUsageLogCtrl extends BaseCtrl {
  model = OTUsageLog

  protected preprocessBeforeInsertToDb(singleQueryObject: any): any {
    singleQueryObject.timestamp = new Date(singleQueryObject.timestamp)
    return singleQueryObject
  }


  // Insert many
  insertMany = (req, res) => {
    const list: Array<any> = req.body.map(b => this.preprocessBeforeInsertToDb(JSON.parse(b)))
    this.model.insertMany(list, (err, docs) => {
      if (err) {
          console.log("usage log insert failed")
          console.log(err)
          res.status(500).send(err)
      } else {
        res.status(200).json(docs. map(i => i["localId"]))
      }
    })
  }

  getLogsOfUser = (req, res) => {
    const userId = req.params.userId
    OTUsageLog.find({user: userId}).then(logs=>{
      res.status(200).send(logs || [])
    }).catch(err=>{
      res.status(500).send(err)
    })
  }


}
