import OTUser from '../../models/ot_user';
import OTResearcher from '../../models/ot_researcher'
import OTTracker from '../../models/ot_tracker'
import OTTrigger from '../../models/ot_trigger'
import OTItem from '../../models/ot_item'
import OTParticipant from '../../models/ot_participant'
import * as mongoose from 'mongoose';
import { PARAMETERS } from '@angular/core/src/util/decorators';
import { merge } from 'utils';

export default class TrackingDataCtrl {
  private _getModelsOfExperiment(model: mongoose.Model<any>, experimentId: string, options: {
    excludeRemoved?: boolean
    excludeExternals?: boolean
  } = { excludeExternals: true, excludeRemoved: true }): Promise<any> {

    return OTParticipant.find({
      experiment: experimentId,
      isDenied: { $ne: true }, isConsentApproved: true, dropped: { $ne: true }
    }, { _id: 1, user: 1 }).then(
      participants => {
        console.log(participants)
        if (participants.length > 0) {
          const condition = { user: { $in: participants.map(p => p["user"]) } }

          if (options.excludeExternals==true) {
            if(model !== OTItem)
            {
            }else condition["flags.experiment"] = experimentId
          }

          if (options.excludeRemoved==true) {
            condition["removed"] = { $ne: true }
          }

          return model.find(condition)
        } else return []
      }
      )
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