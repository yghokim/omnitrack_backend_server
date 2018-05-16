import BaseCtrl from './base';
import * as mongoose from 'mongoose';
import OTUser from '../models/ot_user';
import OTUsageLog from '../models/ot_usage_log';
import { IUsageLogDbEntity } from '../../omnitrack/core/db-entity-types';
import { makeArrayLikeQueryCondition } from '../server_utils';
import OTParticipant from '../models/ot_participant';

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
        res.status(200).json(docs.map(i => i["localId"]))
      }
    })
  }

  getLogsOfUser = (req, res) => {
    const userId = req.params.userId
    OTUsageLog.find({ user: userId }).then(logs => {
      res.status(200).send(logs || [])
    }).catch(err => {
      res.status(500).send(err)
    })
  }

  static analyzeSessionSummary(additionalFilter: any = null, userIds: Array<string> = null): Promise<Array<{ user: any, lastTimestamp: number, totalDuration: number }>> {

    const filterCondition = additionalFilter || {}
    filterCondition["$or"] = [{ name: "session" }, { name: "OTSynchronizationService", sub: "synchronization_finished" }]
    if (userIds) {
      filterCondition["user"] = { $in: userIds }
    }

    return OTUsageLog.aggregate([
      { $match: filterCondition },
      { $sort: { timestamp: -1 } },
      { $group: { _id: { user: "$user", name: "$name" }, lastTimestamp: { $first: "$timestamp" } } },
      { $group: { _id: "$_id.user", logs: { $push: "$$ROOT" } } }
    ]).exec()
  }

  static filterUserGroupedUsageLogs(filter: any = null, userIds: string | Array<string> = null): Promise<Array<{ user: string, logs: Array<IUsageLogDbEntity> }>> {
    const filterCondition = filter || {}
    if (userIds) {
      filterCondition["user"] = makeArrayLikeQueryCondition(userIds)
    }

    return OTUsageLog.aggregate([
      { $match: filterCondition },
      { $sort: { timestamp: -1 } },
      { $group: { _id: "$user", logs: { $push: "$$ROOT" } } }
    ]).exec().then(list=>list.map(entry => { return {user: entry._id, logs: entry.logs} }))
  }

  requestAnalyzedSessionLogs = (req, res) => {
    const filter = {}

    if (req.query.from || req.query.to) {
      filter["timestamp"] = {}

      if (req.query.from) {
        filter["timestamp"]["$gte"] = req.query.from
      }

      if (req.query.to) {
        filter["timestamp"]["$lte"] = req.query.to
      }
    }

    OTUsageLogCtrl.analyzeSessionSummary(filter, req.query.userIds).then(list => {
      res.status(200).send(list)
    }).catch(err => {
      res.status(500).send(err)
    })
  }

  getFilteredUserGroupedUsageLogs = (req, res) => {
    let filter: any
    if (req.query.filter) {
      filter = req.query.filter = JSON.parse(req.query.filter)
    } else filter = {}

    if (req.query.from || req.query.to) {
      filter["timestamp"] = {}

      if (req.query.from) {
        filter["timestamp"]["$gte"] = req.query.from
      }

      if (req.query.to) {
        filter["timestamp"]["$lte"] = req.query.to
      }
    }

    let userIdsPromise: Promise<string | Array<string>>
    if (req.query.experiment) {
      //filter with experiment
      userIdsPromise = OTParticipant.find({ experiment: req.query.experiment }).select("user").lean().then(users => {
        const userIds = users.map(u => u.user)
        if(req.query.userIds){
          if(req.query.userIds instanceof Array){
            return req.query.userIds.filter(id => userIds.indexOf(id) !== -1)
          }
          else{
            if(userIds.indexOf(req.query.userIds) !== -1){
              return req.query.userIds
            }else return []
          }
        }else return userIds
      })
    } else userIdsPromise = Promise.resolve(req.query.userIds)

    userIdsPromise.then(userIds => OTUsageLogCtrl.filterUserGroupedUsageLogs(filter, userIds))
      .then(list => {
        res.status(200).send(list)
      }).catch(err => {
        console.log(err)
        res.status(500).send(err)
      })
  }

}
