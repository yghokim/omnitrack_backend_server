import OTUser from '../../models/ot_user';
import OTResearcher from '../../models/ot_researcher'
import OTTracker from '../../models/ot_tracker'
import OTTrigger from '../../models/ot_trigger'
import OTItem from '../../models/ot_item'
import OTParticipant from '../../models/ot_participant'
import * as mongoose from 'mongoose';
import { PARAMETERS } from '@angular/core/src/util/decorators';
import { merge, deepclone } from '../../../shared_lib/utils';
import { makeArrayLikeQueryCondition } from '../../server_utils';

export default class TrackingDataCtrl {
  private _getModelsOfExperiment(model: mongoose.Model<any>, experimentId: string, userId: string | Array<string> = null, options: {
    excludeRemoved?: boolean
    excludeExternals?: boolean
  } = { excludeExternals: true, excludeRemoved: true }): Promise<Array<any>> {

    const participantQuery = {
      experiment: experimentId,
      isDenied: { $ne: true }, isConsentApproved: true, dropped: { $ne: true }
    }

    if(userId)
    {
      participantQuery["user"] = makeArrayLikeQueryCondition(userId)
    }

    return OTParticipant.find({
      experiment: experimentId,
      isDenied: { $ne: true }, isConsentApproved: true, dropped: { $ne: true }
    }, { _id: 1, user: 1 }).lean().then(
      participants => {
        if (participants.length > 0) {
          const condition = { user: { $in: participants.map(p => p["user"]) } }
          if (options.excludeRemoved==true) {
            condition["removed"] = { $ne: true }
          }

          if (options.excludeExternals==true) {
            if(model === OTItem)
            {
              const trackerCondition = deepclone(condition)
              trackerCondition["flags.experiment"] = experimentId
              return OTTracker.find(trackerCondition, {_id: 1}).lean().then(
                trackers =>{
                  condition["tracker"] = {$in: trackers.map(t=>t._id)}
                  return OTItem.find(condition).lean().then(
                    paginationResult => {
                      return paginationResult
                      })
                })
            }else{
              condition["flags.experiment"] = experimentId
            }
            return (model as any).find(condition).lean()
          } else {
            
          }
      }
      return []
    })
  }

  getChildrenOfExperiment(model: mongoose.Model<any>) {
    return (req, res) => {
      const experimentId = req.params.experimentId
      const options = { excludeExternals: req.query.excludeExternals || true, excludeRemoved: req.query.excludeRemoved || true }
      this._getModelsOfExperiment(model, experimentId, req.query.userId, options).then(
        list => {
          res.header("Content-Type", "application/json")
          if(list.length < 200){
            res.status(200).send(JSON.stringify(list, null, 2))
          }
          else{
            res.write("[")
            res.write(list.map(item =>JSON.stringify(item, null, 2)).join(",\n"))
            res.write("]")
            res.end()
          }
        })
        .catch(
        err => {
          console.log(err)
          res.status(500).send(err)
        })
    }
  }

}

const trackingDataCtrl = new TrackingDataCtrl()
export { trackingDataCtrl }
