import { IUsageLogDbEntity } from '../../omnitrack/core/db-entity-types';
import OTParticipant from '../models/ot_participant';
import OTUsageLog from '../models/ot_usage_log';
import { makeArrayLikeQueryCondition } from '../server_utils';
import BaseCtrl from './base';
import * as moment from 'moment';
import { deepclone } from '../../shared_lib/utils';

export class OTUsageLogCtrl {

  private preprocessBeforeInsertToDb(singleQueryObject: any): any {
    singleQueryObject.timestamp = new Date(singleQueryObject.timestamp)
    return singleQueryObject
  }

  _getErrorLogs(filterBase: any): Promise<Array<IUsageLogDbEntity>> {
    const filter = deepclone(filterBase)
    filter.name = "exception"
    return OTUsageLog.find(filter).populate("user", { email: 1 }).sort({ timestamp: -1 }).lean().then(docs => docs)
  }


  // Insert many
  insertMany = (req, res) => {
    const list: Array<any> = req.body.map(b => this.preprocessBeforeInsertToDb(JSON.parse(b)))
    OTUsageLog.insertMany(list, (err, docs) => {
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

  analyzeSessionSummary(additionalFilter: any = null, userIds: Array<string> = null): Promise<Array<{ user: any, lastTimestamp: number, totalDuration: number }>> {

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
    ]).allowDiskUse(true).exec()
  }

  filterUserGroupedUsageLogs(filter: any = null, userIds: string | Array<string> = null): Promise<Array<{ user: string, logs: Array<IUsageLogDbEntity> }>> {
    const filterCondition = filter || {}
    if (userIds) {
      filterCondition["user"] = makeArrayLikeQueryCondition(userIds)
    }

    const pipeline = [
      { $match: filterCondition },
      { $sort: { timestamp: -1 } },
      { $group: { _id: "$user", logs: { $push: "$$ROOT" } } }
    ]

    if (Object.keys(filterCondition).length === 0) {
      console.log("shift empty condition")
      pipeline.shift()
    }

    return OTUsageLog.aggregate(pipeline).allowDiskUse(true).exec().then(list => {
      return list.map(entry => ({ user: entry._id, logs: entry.logs }))
        .filter(entry => entry.user != null)
    })
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

    this.analyzeSessionSummary(filter, req.query.userIds).then(list => {
      res.status(200).send(list)
    }).catch(err => {
      res.status(500).send(err)
    })
  }

  getFilteredUserGroupedUsageLogs = (req, res) => {
    let filter: any
    if (req.query.filter) {
      filter = req.query.filter = JSON.parse(req.query.filter)
    } else { filter = {} }

    if ((req.query.from !== "null" && req.query.from) || (req.query.to !== "null" && req.query.to)) {
      filter["timestamp"] = {}

      if (req.query.from !== "null" && req.query.from) {
        filter["timestamp"]["$gte"] = moment(req.query.from).toDate()
      }

      if (req.query.to !== "null" && req.query.to) {
        filter["timestamp"]["$lte"] = moment(req.query.to).toDate()
      }
    }

    let userIdsPromise: Promise<string | Array<string>>
    if (req.query.experiment) {
      // filter with experiment
      userIdsPromise = OTParticipant.find({ experiment: req.query.experiment }).select("user").lean().then(users => {
        const userIds = users.map(u => u.user)
        if (req.query.userIds) {
          if (req.query.userIds instanceof Array) {
            return req.query.userIds.filter(id => userIds.indexOf(id) !== -1)
          } else {
            if (userIds.indexOf(req.query.userIds) !== -1) {
              return req.query.userIds
            } else { return [] }
          }
        } else { return userIds }
      })
    } else if (req.query.userIds) {
      userIdsPromise = Promise.resolve(req.query.userIds)
    } else {
      userIdsPromise = null
    }

    if (userIdsPromise) {
      userIdsPromise.then(userIds => this.filterUserGroupedUsageLogs(filter, userIds))
        .then(list => {
          res.status(200).send(list)
        }).catch(err => {
          console.log(err)
          res.status(500).send(err)
        })
    } else { // did not put user ids. Query whole logs in this server, but anonymise
      console.log("return anonymized list")
      this.filterUserGroupedUsageLogs(filter, null).then(
        list => {
          // anonymize
          const md5 = require("md5");
          list.forEach(userRow => {
            userRow.user = md5(userRow.user)
            userRow.logs.forEach(log => {
              log.user = userRow.user
            })
          })
          res.status(200).send(list)
        }
      ).catch(err => {
        console.log(err)
        res.status(500).send(err)
      })
    }
  }

  getErrorLogs = (req, res) => {
    let filter: any
    if (req.query.filter) {
      filter = req.query.filter = JSON.parse(req.query.filter)
    } else { filter = {} }

    if ((req.query.from !== "null" && req.query.from != null) || (req.query.to !== "null" && req.query.to != null)) {
      filter["timestamp"] = {}

      if (req.query.from !== "null" && req.query.from != null) {
        filter["timestamp"]["$gte"] = moment(req.query.from).toDate()
      }

      if (req.query.to !== "null" && req.query.to != null) {
        filter["timestamp"]["$lte"] = moment(req.query.to).toDate()
      }
    }

    this._getErrorLogs(filter).then(logs => {
      res.status(200).send(logs)
    }).catch(ex => {
      console.error(ex)
      res.status(500).send(ex)
    })
  }
}

const ctrl = new OTUsageLogCtrl()
export default ctrl