import PredefinedPackage from '../../omnitrack/core/predefined_package';
import app from '../app';
import OTTracker from '../models/ot_tracker';
import OTTrigger from '../models/ot_trigger';
import { ModelConverter } from '../../omnitrack/core/model_converter';

export default class OTTrackingPackageCtrl {
  private makeQuery(model: any, ids: Array<string>, ownerId: string = null){
    const base = model.find().where("_id").in(ids)
    if(ownerId){
      return base.where("user", ownerId).lean()
    }else return base.lean()
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

  getExtractedTrackingPackageJson = (req, res)=>{
    const trackerIds: Array<string> = req.query["trackerIds"] || []
    const triggerIds: Array<string> = req.query["triggerIds"] || []
    var userId = null
    if(res.locals.user){
      userId = res.locals.user.uid
    }

    if(trackerIds.length === 0 && triggerIds.length === 0){
      res.status(500).send({err: "No input ids"})
      return
    }

    this.extractTrackingPackage(trackerIds, triggerIds, userId).then(
      pack=>{
        res.status(200).send(pack)
      }
    ).catch(err=>{
      console.log(err)
      res.status(500).send(err)
    })
  }
  
}

const trackingPackageCtrl = new OTTrackingPackageCtrl()
export { trackingPackageCtrl }