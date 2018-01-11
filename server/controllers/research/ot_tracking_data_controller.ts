import OTUser from '../../models/ot_user';
import OTResearcher from '../../models/ot_researcher'
import OTTracker from '../../models/ot_tracker'
import OTTrigger from '../../models/ot_trigger'
import OTItem from '../../models/ot_item'
import OTParticipant from '../../models/ot_participant'
import * as mongoose from 'mongoose';
import * as  mongoosePaginate from 'mongoose-paginate';
import { PARAMETERS } from '@angular/core/src/util/decorators';
import { merge } from '../../../shared_lib/utils';
import { PaginateResult, Model } from 'mongoose';

export default class TrackingDataCtrl {
  private _getModelsOfExperiment(model: mongoose.Model<any>, experimentId: string, options: {
    excludeRemoved?: boolean
    excludeExternals?: boolean
    select?: string
    pagination?: {limit: number, page: number}
  } = { excludeExternals: true, excludeRemoved: true }): Promise<Array<PaginateResult<any>>> {
    return OTParticipant.find({
      experiment: experimentId,
      isDenied: { $ne: true }, isConsentApproved: true, dropped: { $ne: true }
    }, { _id: 1, user: 1 }).then(
      participants => {
        console.log(participants)
        if (participants.length > 0) {
          
          const paginationOptions = merge({
            select: options.select}, options.pagination || {limit: Number.MAX_SAFE_INTEGER, page: 0}, true, true)
          const condition = { user: { $in: participants.map(p => p["user"]) } }

          if (options.excludeRemoved==true) {
            condition["removed"] = { $ne: true }
          }

          if (options.excludeExternals==true) {
            if(model === OTItem)
            {
              return OTTracker.find(condition, {_id: 1}).then(
                trackers =>{
                  condition["tracker._id"] = {$in: trackers.map(t=>t._id)}
                  return OTItem.paginate(condition, paginationOptions).then(
                      paginationResult => {
                        return paginationResult
                      })
                })
            }else{condition["flags.experiment"] = experimentId
          }

          return (model as any).paginate(condition, paginationOptions)
        } else return []
      }
    })
  }

  getChildrenOfExperiment(model: mongoose.Model<any>) {
    return (req, res) => {
      const experimentId = req.params.experimentId
      const options = { excludeExternals: req.query.excludeExternals || true, excludeRemoved: req.query.excludeRemoved || true }
      this._getModelsOfExperiment(model, experimentId, options).then(
        list => {
          res.status(200).send(list)
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