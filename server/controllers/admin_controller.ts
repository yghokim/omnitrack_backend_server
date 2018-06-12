import OTUser from '../models/ot_user';
import OTItem from '../models/ot_item';
import OTTracker from '../models/ot_tracker';
import OTTrigger from '../models/ot_trigger';
import OTResearcher from '../models/ot_researcher';
import OTExperiment from '../models/ot_researcher';
import { ModelConverter } from '../../omnitrack/core/model_converter';
import * as fs from 'fs-extra';
import * as path from 'path';
import PredefinedPackage from '../../omnitrack/core/predefined_package';
import app from '../app';

export default class AdminCtrl {

  clearResearchers = (req, res) => {
    OTResearcher.remove({}, (err) => {
      if (err != null) {
        res.sendStatus(500)
      } else {
        OTExperiment.remove({}, (err2) => {
          if (err2 != null) {
            res.sendStatus(500)
          } else {
            res.status(200).send(true)
          }
        })
      }
    })
  }

  removeResearcher = (req, res) => {
    OTResearcher.remove({_id: req.params.researcherId}).then(
      res.status(200).send(true)
    )
  }

  pushUsers = (req, res) => {
    const userData = JSON.parse(req.query.users)
    console.log("push " + userData.length + " user data.")
    OTUser.collection.bulkWrite(userData.map(user => {
      return {insertOne: {"document": user}}
    })).then(bulkResult => {
      console.log(bulkResult)
      res.status(200).send(bulkResult)
    })
  }

  migrateUserTrackingData = (req, res) => {
    const fromUserId = req.query["from"]
    const toUserId = req.query["to"]
    Promise.all([
      OTItem, OTTracker, OTTrigger
    ].map(model => model.update({user: fromUserId}, {$set: {user: toUserId}}, {multi: true})))
      .then(results => {
        console.log(results)
        res.sendStatus(200)
      })
  }

  injectPackageToUser = (req, res) => {
    const userId = req.params.userId
    const creationFlags = req.body.creationFlags
    const packageName = req.params.packageName
    if (packageName != null) {
      switch (packageName) {
        case "example":
          return fs.readJson(path.resolve(__dirname, "../../../../omnitrack/examples/example_trackers.json"))
            .then(
            pack => {
              return app.omnitrackModule().injectPackage(userId, pack, creationFlags)
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
        case "diary":
          return fs.readJson(path.resolve(__dirname, "../../../../omnitrack/examples/diary_study_template.json"))
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
    const isOn = req.params.isOn.toLowerCase() === "true"
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

  removeTracker = (req, res) => {
    const trackerId = req.params.trackerId
    app.commandModule().removeTracker(trackerId, true).then(
      removedNow => {
        res.status(200).send(removedNow)
      }
    ).catch(
      err => {
        res.status(500).send(err)
      }
      )
  }

  removeUser = (req, res) => {
    const userId = req.params.userId
    app.commandModule().removeUser(userId, false, false).then(
      removed => {
        res.status(200).send(removed)
      }
    ).catch(
      err => {
        res.status(500).send(err)
      }
    )
  }

  getAttributePropertyValue = (req, res) => {
    const trackerId = req.params.trackerId
    const attributeLocalId = req.params.attributeLocalId
    const propertyKey = req.params.propertyKey
    app.commandModule().getAttributePropertyValue(trackerId, attributeLocalId, propertyKey).then(
      result =>
      res.status(200).send(result)
    )
    .catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }

  setAttributePropertySerializedValue = (req, res) => {
    const trackerId = req.query.trackerId
    const attributeLocalId = req.query.attributeLocalId
    const attributeType = req.query.attributeType
    const propertyKey = req.params.propertyKey
    const serializedValue = req.query.serializedValue
    const attributeName = req.query.attributeName

    const trackerFilter = {}
    const attributeFilter = {}
    if (trackerId) {
      trackerFilter["_id"] = trackerId
    }

    if (attributeLocalId) {
      attributeFilter["attributes.localId"] = attributeLocalId
    }

    if (attributeType) {
      attributeFilter["attributes.type"] = Number(attributeType)
    }

    if (attributeName) {
      attributeFilter["attributes.name"] = attributeName
    }

    app.commandModule().setAttributePropertySerializedValue(trackerFilter, attributeFilter, propertyKey, serializedValue).then(
      result => {
        res.status(200).send(result)
      }
    ).catch(err => {
        res.status(500).send(err)
      }
    )

  }
}
