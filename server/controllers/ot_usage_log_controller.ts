import BaseCtrl from './base';
import * as mongoose from 'mongoose';
import OTUser from '../models/ot_user';
import OTUsageLog from '../models/ot_usage_log';
import { IUsageLogDbEntity } from '../../omnitrack/core/db-entity-types';

export class OTUsageLogCtrl extends BaseCtrl {
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

  static analyzeSessionLogs(additionalFilter: any = null, userIds: Array<string>=null): Promise<Array<{user: any, lastTimestamp: number, totalDuration: number}>>{

    const filterCondition = additionalFilter || {}
    filterCondition["$or"] = [{name: "session"}, {name: "OTSynchronizationService", sub: "synchronization_finished"}]
    if(userIds){
      filterCondition["user"] = {$in: userIds}
    }

    return OTUsageLog.aggregate([
      {$match: filterCondition},
      {$sort: {timestamp: -1}},
      {$group: {_id: {user: "$user", name: "$name"}, lastTimestamp: {$first: "$timestamp"}}},
      {$group: {_id: "$_id.user", logs: {$push: "$$ROOT"}}}
    ]).exec()
  }

  requestAnalyzedSessionLogs = (req, res)=>{
    const filter = {}
    
    if(req.query.from || req.query.to){
      filter["timestamp"] = {}
      
      if(req.query.from){
        filter["timestamp"]["$gte"] = req.query.from
      }

      if(req.query.to){
        filter["timestamp"]["$lte"] = req.query.to
      }
    }

    OTUsageLogCtrl.analyzeSessionLogs(filter, req.query.userIds).then(list=>{
      res.status(200).send(list)
    }).catch(err=>{
      res.status(500).send(err)
    })
  }

}
