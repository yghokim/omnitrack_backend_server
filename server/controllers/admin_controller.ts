
import OTTracker from '../models/ot_tracker';
import OTTrigger from '../models/ot_trigger';
import { ModelConverter } from '../../omnitrack/core/model_converter';
import * as fs from 'fs-extra';
import * as path from 'path';
import PredefinedPackage from '../../omnitrack/core/predefined_package';
import app from '../app';

export default class AdminCtrl {
  extractPredefinedPackage = (req, res) => {
    const trackerIds = req.query["trackerIds"]
    const triggerIds = req.query["triggerIds"]
    OTTracker.find().where("_id").in(trackerIds).then(
      trackers => Promise.resolve(trackers.map(t => ModelConverter.convertDbToClientFormat(t, { excludeTimestamps: true })))
    ).then(trackers => {
      return OTTrigger.find().where("_id").in(triggerIds).then(
        trigger => Promise.resolve(
          new PredefinedPackage(
            trackers,
            trigger.map(tr => ModelConverter.convertDbToClientFormat(tr, { excludeTimestamps: true }))
          )
        )
      )
    })
      .then(pack => {
        res.status(200).send(pack)
      })
      .catch(err => {
        res.status(500).send(err)
      })
  }

  injectPackageToUser = (req, res) => {
    const userId = req.params.userId
    const packageName = req.params.packageName
    if (packageName != null) {
      switch (packageName) {
        case "example":
          return fs.readJson(path.resolve(__dirname,"../../../../omnitrack/examples/example_trackers.json"))
            .then(
            pack => {
              return app.omnitrackModule().injectPackage(userId, pack)
            }
            ).then(
            () => {
              res.status(200).send(true)
            }
            ).catch(
            err => {
              res.status(500).send(err)
            }
            )
        
      }
    }
  }

  attachTrackerToTrigger = (req, res) => {
    const triggerId = req.query.triggerId
    const trackerId = req.params.trackerId
    req.app.get("omnitrack").commandModule.addTrackerToTrigger(triggerId, trackerId)
      .then(changed => {
        res.status(200).send(changed)
      })
      .catch(err => {
        res.status(500).send(err)
      })
  }

  setTriggerSwitch = (req, res) => {
    const triggerId = req.params.triggerId
    const isOn = req.params.isOn.toLowerCase() == "true"
    console.log("triggerId: " + triggerId)
    console.log("isOn: " + isOn)
    req.app.get("omnitrack").commandModule.setTriggerSwitch(triggerId, isOn)
      .then(changed => {
        res.status(200).send(changed)
      })
      .catch(err => {
        res.status(500).send(err)
      })
  }

  removeTracker = (req, res) =>{
    const trackerId = req.params.trackerId
    app.commandModule().removeTracker(trackerId, true).then(
      removedNow=>{
        res.status(200).send(removedNow)
      }
    ).catch(
      err=>{
        res.status(500).send(err)
      }
    )
  }
}
