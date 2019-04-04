import PredefinedPackage from '../../omnitrack/core/predefined_package';
import OTTracker from '../models/ot_tracker';
import OTTrigger from '../models/ot_trigger';
import OTTrackingPackage from '../models/ot_temporary_tracking_package';
import { ModelConverter } from '../../omnitrack/core/model_converter';
import { isString } from '../../shared_lib/utils';

export default class OTTrackingPackageCtrl {
  private makeQuery(model: any, ids: Array<string>, ownerId: string = null) {
    const base = model.find().where("_id").in(ids)
    if (ownerId) {
      return base.where("user", ownerId).lean()
    } else { return base.lean() }
  }
  extractTrackingPackage(trackerIds: Array<string>, triggerIds: Array<string>, ownerId: string = null): Promise<PredefinedPackage> {

    return Promise.all(
      [this.makeQuery(OTTracker, trackerIds, ownerId),
      this.makeQuery(OTTrigger, triggerIds, ownerId)]
    ).then(result => result.map(arr => arr.map(elm => ModelConverter.convertDbToClientFormat(elm, { excludeTimestamps: true })))
    ).then(result => {
      return new PredefinedPackage(
        result[0],
        result[1]
      )
    })
  }

  getExtractedTrackingPackageJson = (req, res) => {
    const trackerIds: Array<string> = req.query["trackerIds"] || []
    const triggerIds: Array<string> = req.query["triggerIds"] || []
    let userId = null
    if (res.locals.user) {
      userId = res.locals.user.uid
    }

    if (trackerIds.length === 0 && triggerIds.length === 0) {
      res.status(500).send({ err: "No input ids" })
      return
    }

    this.extractTrackingPackage(trackerIds, triggerIds, userId).then(
      pack => {
        res.status(200).send(pack)
      }
    ).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }

  postTrackingPackageToGlobalList = (req, res) => {
    const userId = res.locals.user.uid
    const data = isString(req.body.data) === true ? JSON.parse(req.body.data) : req.body.data
    const logic = (isFirst: boolean) => {
      let accessKey = require('randomstring').generate({ length: 4, charset: 'numeric' })

      OTTrackingPackage.create({
        uploader: userId,
        data: data,
        accessKey: accessKey
      }).then(entry => {
        res.status(200).send(entry["accessKey"])
      }).catch(err => {
        if (err.code === 11000 && isFirst === true) {
          console.log("tracking plan access key duplicates. try another one...")
          OTTrackingPackage.find({}, { select: "accessKey" }).then(
            entries => {
              const keys = entries.map(k => k["accessKey"])
              while (keys.indexOf(accessKey) !== -1) {
                accessKey = require('randomstring').generate({ length: 4, charset: 'numeric' })
              }
              logic(false)
            }
          )
        } else {
          console.log(err)
          res.status(500).send(err)
        }
      })
    }

    logic(true)
  }

  getTrackingPackageSimpleInfos = (req, res) => {
    OTTrackingPackage.find({}, "_id name description uploader updatedAt", { multi: true }).lean().populate("uploader", "email").then(list => {
      res.status(200).send(list)
    }).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }

  getTemporaryTrackingPackageWithCode = (req, res) => {
    OTTrackingPackage.findOneAndRemove({ accessKey: req.params.code }, { select: "data" }).then(
      doc => {
        if (doc != null) {
          res.status(200).send(doc["data"])
        } else {
          res.status(404).send(null)
        }
      }
    ).catch(err => {
      res.status(500).send(err)
    })
  }

  clearTrackingPackageGlobalList = (req, res) => {
    OTTrackingPackage.remove({}).then(
      result => {
        res.status(200).send(result)
      }
    ).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }

}

const trackingPackageCtrl = new OTTrackingPackageCtrl()
export { trackingPackageCtrl }