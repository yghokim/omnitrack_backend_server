import OTTracker from '../../models/ot_tracker'
import OTTrigger from '../../models/ot_trigger'
import OTUser from '../../models/ot_user'
import OTItem from '../../models/ot_item'
import * as mongoose from 'mongoose';
import { merge, deepclone } from '../../../shared_lib/utils';
import { makeArrayLikeQueryCondition } from '../../server_utils';
import { experimentCtrl } from './ot_experiment_controller';
import OTExperiment from '../../models/ot_experiment';
import app from '../../app';
import C from '../../server_consts'
import { ITrackerDbEntity, ITriggerDbEntity } from '../../../omnitrack/core/db-entity-types';

export default class TrackingDataCtrl {

  private _getModelsOfExperiment(model: mongoose.Model<any>, experimentId: string, userId: string | Array<string> = null, options: {
    excludeRemoved?: boolean
    excludeExternals?: boolean
  } = { excludeExternals: true, excludeRemoved: true }): Promise<Array<any>> {

    const participantQuery = {
      experiment: experimentId, "participationInfo.dropped": { $ne: true }
    }

    if (userId) {
      participantQuery["_id"] = makeArrayLikeQueryCondition(userId)
    }

    return OTUser.find(participantQuery, { _id: 1 }).lean().then(
      participants => {
        if (participants.length > 0) {
          const condition = { "user": { $in: participants.map(p => p._id) } }
          if (options.excludeRemoved === true) {
            condition["removed"] = { $ne: true }
          }
          
          return (model as any).find(condition).lean()
        }else return []
      })
  }

  getChildrenOfExperiment(model: mongoose.Model<any>) {
    return (req, res) => {
      const experimentId = req.params.experimentId
      const options = { excludeExternals: req.query.excludeExternals || true, excludeRemoved: req.query.excludeRemoved || true }
      this._getModelsOfExperiment(model, experimentId, req.query.userId, options).then(
        list => {
          res.header("Content-Type", "application/json")
          if (list.length < 200) {
            res.status(200).send(JSON.stringify(list, null, 2))
          } else {
            res.write("[")
            res.write(list.map(item => JSON.stringify(item, null, 2)).join(",\n"))
            res.write("]")
            res.end()
          }
        })
        .catch(
          err => {
            console.error(err)
            res.status(500).send(err)
          })
    }
  }

  private _getEntitiesOfUserInExperiment(experimentId: string, researcherId: string, userId: string): Promise<{trackers: Array<ITrackerDbEntity>, triggers: Array<ITriggerDbEntity>}>{
    return experimentCtrl.checkResearcherPermitted(researcherId, experimentId).then(
      permitted=>{
        if(permitted === true){          
          return Promise.all(
            [OTTracker, OTTrigger].map(m => this._getModelsOfExperiment(m, experimentId, userId, {excludeExternals: true, excludeRemoved: false}))
          ).then(result => ({trackers: result[0], triggers: result[1]}))
        }else{
          throw Error("NotPermitted")
        }
      }
    )
  }

  getEntitiesOfUserInExperiment = (req, res)=>{
    const researcherId = req.researcher.uid
    const experimentId = req.params.experimentId
    const userId = req.params.userId
    this._getEntitiesOfUserInExperiment(experimentId, researcherId, userId).then(
      result => {
        res.status(200).send(result)
      }
    ).catch(ex=>{
      console.error(ex)
      res.status(500).send(ex)
    })
  }

  updateTriggerOfExperiment = (req, res)=>{
    const researcherId = req.researcher.uid
    const experimentId = req.body.experimentId
    const triggerId = req.body.triggerId
    experimentCtrl.checkResearcherPermitted(researcherId, experimentId).then(
      permitted=>{
        if(permitted===false){
          res.status(500).send({error:"NotPermitted"})
        }else{
          OTTrigger.findOneAndUpdate({_id: triggerId, "flags.experiment": experimentId}, req.body.update, {new: true})
            .lean()
            .then(trigger => {
              if(trigger!=null){
                app.pushModule().sendSyncDataMessageToUser(trigger.user, [C.SYNC_TYPE_TRIGGER]).then(
                  pushResult=>{
                    res.status(200).send({updated: trigger})
                  }
                )
              }else{
                res.status(404).send({error: "NoSuchTrigger"})
              }
            })
            .catch(err => {
              console.error(err)
              res.status(500).send(err)
            })
        }
      }
    )
  }

  updateTrackerOfExperiment = (req, res) => {
    const researcherId = req.researcher.uid
    const experimentId = req.body.experimentId
    const trackerId = req.body.trackerId

    experimentCtrl.checkResearcherPermitted(researcherId, experimentId).then(
      permitted=>{
        if(permitted===false){
          res.status(500).send({error:"NotPermitted"})
        }else{
          OTTracker.findOneAndUpdate({_id: trackerId, "flags.experiment": experimentId}, req.body.update, {new: true})
            .lean()
            .then(tracker => {
              if(tracker!=null){
                app.pushModule().sendSyncDataMessageToUser(tracker.user, [C.SYNC_TYPE_TRACKER]).then(
                  pushResult=>{
                    res.status(200).send({updated: tracker})
                  }
                )
              }else{
                res.status(404).send({error: "NoSuchTracker"})
              }
            })
            .catch(err => {
              console.error(err)
              res.status(500).send(err)
            })
        }
      }
    )
  }

  updateFieldOfTrackerOfExperiment = (req, res) => {
    
    const researcherId = req.researcher.uid
    const experimentId = req.body.experimentId
    const trackerId = req.body.trackerId
    const fieldLocalId = req.body.fieldLocalId

    const update = {}
    for(const key of Object.keys(req.body.update)){
      update["fields.$." + key] = req.body.update[key]
    }

    experimentCtrl.checkResearcherPermitted(researcherId, experimentId).then(
      permitted=>{
        if(permitted===false){
          res.status(500).send({error:"NotPermitted"})
        }else{
          OTTracker.findOneAndUpdate({
            _id: trackerId, 
            "flags.experiment": experimentId, 
            "fields.localId": fieldLocalId},
            update, 
            {new: true})
            .lean()
            .then(tracker => {
              if(tracker!=null){
                app.pushModule().sendSyncDataMessageToUser(tracker.user, [C.SYNC_TYPE_TRACKER]).then(
                  pushResult=>{
                    res.status(200).send({updated: tracker})
                  }
                )
              }else{
                res.status(404).send({error: "NoSuchTracker"})
              }
            })
            .catch(err => {
              console.error(err)
              res.status(500).send(err)
            })
        }
      }
    )
  }
}

const trackingDataCtrl = new TrackingDataCtrl()
export { trackingDataCtrl }
