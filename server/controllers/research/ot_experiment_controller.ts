import OTUser from '../../models/ot_user'
import OTTrigger from '../../models/ot_trigger'
import OTTracker from '../../models/ot_tracker'
import OTResearcher from '../../models/ot_researcher'
import OTExperiment from '../../models/ot_experiment'
import OTInvitation from '../../models/ot_invitation'
import otUsageLogCtrl from '../ot_usage_log_controller';
import OTParticipant from '../../models/ot_participant'
import { ExperimentPermissions } from '../../../omnitrack/core/research/experiment'
import { Document, DocumentQuery, Query } from 'mongoose';
import app from '../../app';
import { SocketConstants } from '../../../omnitrack/core/research/socket';
import { MessageData } from '../../modules/push.module';
import { deepclone, groupArrayByVariable } from '../../../shared_lib/utils';
import { makeArrayLikeQueryCondition } from '../../server_utils';
import { IParticipantDbEntity } from '../../../omnitrack/core/db-entity-types';
import { clientBuildCtrl } from './ot_client_build_controller';


export default class OTExperimentCtrl {

  makeExperimentAndCorrespondingResearcherQuery(experimentId: string, researcherId: string): any {
    return {
      _id: experimentId,
      $or: [{ manager: researcherId }, { "experimenters.researcher": researcherId }]
    }
  }

  private _populateExperimentDocumentForInfo(doc: any) {
    return doc.populate({ path: "manager", select: "_id email alias" })
      .populate({ path: "experimenters.researcher", select: "_id email alias" })
  }

  private _getExperiment(researcherId: string, experimentId: string): Promise<Document> {
    return this._populateExperimentDocumentForInfo(OTExperiment.findOne(this.makeExperimentAndCorrespondingResearcherQuery(experimentId, researcherId)))
      .then(doc => doc)
  }

  private _updateCollaboratorPermissions(experimentId: string, managerId: string, collaboratorId: string, permissions: ExperimentPermissions): Promise<boolean> {
    return OTExperiment.findOneAndUpdate({ _id: experimentId, "experimenter.researcher": collaboratorId, manager: managerId }, {
      $push: {
        "experimenters.0.permissions": permissions
      }
    }).then(
      experiment => {
        if (experiment) {
          app.socketModule().sendUpdateNotificationToExperimentSubscribers(experimentId, { model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_EDITED })
          app.socketModule().sendUpdateNotificationToResearcherSubscribers(collaboratorId, { model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_PERMISSION_CHANGED })

          return true
        } else { return false }
      }
    )
  }

  private _addCollaborator(experimentId: string, managerId: string, collaboratorId: string, permissions: ExperimentPermissions): Promise<boolean> {
    return OTExperiment.findOneAndUpdate({ _id: experimentId, manager: managerId, "experimenters.researcher": { $ne: collaboratorId } }, {
      $push: {
        experimenters: { researcher: collaboratorId, permissions: permissions }
      }
    }).then(
      experiment => {
        if (experiment) {
          app.socketModule().sendUpdateNotificationToExperimentSubscribers(experimentId, { model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_EDITED })
          app.socketModule().sendUpdateNotificationToResearcherSubscribers(collaboratorId, { model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_INVITED })

          return true
        } else { return false }
      }
    )
  }

  private _removeCollaborator(experimentId: string, managerId: string, collaboratorId: string): Promise<boolean> {
    return OTExperiment.findOneAndUpdate({ _id: experimentId, manager: managerId, "experimenters.researcher": collaboratorId }, {
      $pull: {
        "experimenters": { researcher: collaboratorId }
      }
    }).lean().then(
      result => result != null
    )
  }

  private _restoreExperimentTrackingEntities(experimentId: string): Promise<boolean> {
    return Promise.all([OTTracker, OTTrigger].map(model => {
      return model.update({
        "flags.injected": true,
        "flags.experiment": experimentId
      }, { removed: false }, { multi: true })
    })).then(
      result => {
        return true
      }
    )
  }

  private _createExperimentByInfo(name: string, managerId: string): Promise<Document> {
    const newExperiment = new OTExperiment({ name: name, manager: managerId })
    return newExperiment.save()
  }

  private _removeExperiment(experimentId: string, managerId: string): Promise<boolean> {
    return OTExperiment.findOneAndRemove({ _id: experimentId, manager: managerId }).then(removed => {
      if (removed) {
        return Promise.all([OTTracker, OTTrigger].map(model => {
          return model.update({
            "flags.injected": true,
            "flags.experiment": experimentId
          }, { removed: true }, { multi: true })
        })).then(result => {
          return OTParticipant.find({ experiment: experimentId }, { _id: 1, user: 1 }).then(participants => {
            app.pushModule().sendDataMessageToUser(participants.map(r => r["user"]), app.pushModule().makeFullSyncMessageData()).then(
              messageResult => {
                console.log(messageResult)
              })

            return Promise.all([OTParticipant.remove({ experiment: experimentId }), OTInvitation.remove({ experiment: experimentId }), clientBuildCtrl.handleExperimentRemoval(experimentId)]).then(
              res => {
                // socket
                app.socketModule().sendUpdateNotificationToExperimentSubscribers(experimentId, { model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_REMOVED })
                return true
              })
          })
        })
      } else { return false }
    })
  }

  /**
   *
   *
   * @param {string} invitationCode
   * @param {string} experimentId
   * @returns {Promise<boolean>} whether the invitation code is of the experiment.
   * @memberof OTExperimentCtrl
   */
  public matchInvitationWithExperiment(invitationCode: string, experimentId: string): Promise<boolean> {
    console.log("match invitation code", invitationCode, "and the experiment", experimentId)
    return OTInvitation.findOne({ code: invitationCode, experiment: experimentId }).lean().then(
      invit => {
        if (invit) {
          return true
        } else {
          return false
        }
      }
    )
  }

  getExperiment = (req, res) => {
    const researcherId = req.researcher.uid
    const experimentId = req.params.experimentId
    this._getExperiment(researcherId, experimentId).then(exp => {
      res.status(200).json(exp)
    })
      .catch(err => {
        console.log(err)
        res.status(500).send(err)
      })
  }

  getParticipants = (req, res) => {
    const experimentId = req.params.experimentId
    OTParticipant.find({ experiment: experimentId }).populate("user").lean()
      .then(
        participants => {
          if (participants) {
            otUsageLogCtrl.analyzeSessionSummary(null, participants.map(p => p.user._id)).then(
              usageLogAnalysisResults => {
                participants.forEach(participant => {
                  const analysis = usageLogAnalysisResults.find(r =>
                    r["_id"] === participant.user._id)
                  if (analysis) {
                    analysis["logs"].forEach(log => {
                      switch (log._id.name) {
                        case "session":
                          participant["lastSessionTimestamp"] = log["lastTimestamp"]
                          break;
                        case "OTSynchronizationService":
                          participant["lastSyncTimestamp"] = log["lastTimestamp"]
                          break;
                      }
                    })
                  } else {
                    console.log("no usage log matches.")
                  }
                })

                res.status(200).send(participants)
              }
            ).catch(err => {
              console.log(err)
              res.status(200).send(participants)
            })
          } else { res.status(200).send(participants) }
        }
      ).catch(err => {
        console.log(err)
        res.status(500).send(err)
      })
  }

  getManagerInfo = (req, res) => {
    const researcherId = req.researcher.uid
    const experimentId = req.params.experimentId
    this._getExperiment(researcherId, experimentId).then(exp => {
      if (exp != null) {
        if (exp["manager"]) {
          OTResearcher.findById(exp["manager"]).then(
            manager => {
              if (manager != null) {
                res.status(200).json(
                  {
                    uid: manager["_id"],
                    email: manager["email"],
                    alias: manager["alias"]
                  }
                )
              } else {
                res.sendStatus(404)
              }
            }
          )
        }
      }
    })
  }


  getExperimentInformationsOfResearcher = (req, res) => {
    const researcherId = req.researcher.uid
    console.log("find experiments of the researcher: " + researcherId)
    OTExperiment.find({ $or: [{ manager: researcherId }, { "experimenters.researcher": researcherId }] }, { _id: 1, name: 1, manager: 1, experimenters: 1 })
      .populate({ path: "manager", select: "_id email alias" })
      .then(experiments => {
        res.status(200).json(experiments)
      }).catch(err => {
        console.log(err)
        res.status(500).send(err)
      })
  }

  createExperiment = (req, res) => {
    const researcherId = req.researcher.uid
    if (researcherId) {
      if (req.body.name) {
        this._createExperimentByInfo(req.body.name, researcherId).then(experiment => {
          if (experiment) {
            app.socketModule()
              .sendUpdateNotificationToResearcherSubscribers(researcherId, { model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_ADDED })

            res.status(200).send(experiment)
          } else {
            res.status(500).send({ "error": "CannotCreated" })
          }
        }).catch(err => {
          console.log(err)
          res.status(500).send(err)
        })
      }
    }
  }

  addCollaborator = (req, res) => {
    const managerId = req.researcher.uid
    const collaboratorId = req.body.collaborator
    const experimentId = req.params.experimentId
    const permissions = req.body.permissions
    if (!managerId || !collaboratorId || !experimentId || !permissions) {
      res.status(401).send({ error: "InvalidArguement" })
      return
    }

    this._addCollaborator(experimentId, managerId, collaboratorId, permissions).then(
      updated => {
        res.status(200).send(updated)
      }
    ).catch(err => {
      console.log(err)
      res.status(500).send({ error: err })
    })
  }

  removeCollaborator = (req, res) => {
    const managerId = req.researcher.uid
    const collaboratorId = req.params.collaboratorId
    const experimentId = req.params.experimentId

    if (!managerId || !collaboratorId || !experimentId) {
      res.status(401).send({ error: "InvalidArguement" })
      return
    }

    this._removeCollaborator(experimentId, managerId, collaboratorId)
      .then(updated => {
        res.status(200).send(updated)
      }).catch(err => {
        console.log(err)
        res.status(500).send({ error: err })
      })
  }


  updateCollaboratorPermissions = (req, res) => {
    const managerId = req.researcher.uid
    const collaboratorId = req.body.collaborator
    const experimentId = req.params.experimentId
    const permissions = req.body.permissions
    if (!managerId || !collaboratorId || !experimentId || !permissions) {
      res.status(401).send({ error: "InvalidArguement" })
      return
    }

    this._updateCollaboratorPermissions(experimentId, managerId, collaboratorId, permissions).then(
      updated => {
        res.status(200).send(updated)
      }
    ).catch(err => {
      console.log(err)
      res.status(500).send({ error: err })
    })
  }

  restoreExperimentTrackingEntities = (req, res) => {
    const experimentId = req.params.experimentId
    this._restoreExperimentTrackingEntities(experimentId).then(
      success => {
        res.status(200).send(true)
      }
    )
  }

  updateExperiment = (req, res) => {
    const managerId = req.researcher.uid
    const experimentId = req.params.experimentId
    OTExperiment.updateOne({ _id: experimentId, manager: managerId }, req.body, { new: true }).then(
      updated => {
        if (updated) {
          app.socketModule().sendUpdateNotificationToExperimentSubscribers(experimentId, { model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_EDITED })
          app.socketModule().sendUpdateNotificationToResearcherSubscribers(managerId, { model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_EDITED })
          if (updated["experimenters"]) {
            updated["experimenters"].forEach(experimenter => {
              app.socketModule().sendUpdateNotificationToResearcherSubscribers(experimenter.researcher, { model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_EDITED })
            })
          }

          res.status(200).send({ updated: true, experiment: updated })
        } else {
          res.status(200).send({ updated: false, experiment: updated })
        }
      }
    ).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }

  removeExperiment = (req, res) => {
    const managerId = req.researcher.uid
    const experimentId = req.params.experimentId
    this._removeExperiment(experimentId, managerId).then(success => {
      if (success === true) {
        res.status(200).send(success)
      } else {
        res.status(404).send(false)
      }
    }).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }

  addExampleExperiment = (req, res) => {
    const managerId = req.researcher.uid
    const exampleKey = req.body.exampleKey
    if (exampleKey) {
      app.researchModule().generateExampleExperimentToResearcher(exampleKey, managerId, true).then(experimentId => {
        res.status(200).send({ experimentId: experimentId })
      })
        .catch(err => {
          console.log(err)
          res.status(500).send(err)
        })
    } else {
      res.status(404).send("No example key was passed.")
    }
  }

  getExampleExperimentList = (req, res) => {
    res.status(200).send(app.researchModule().exampleExperimentInformations)
  }

  getPublicInvitationList = (req, res) => {
    const userId = res.locals.user.uid
    res.status(200).send([])
    // TODO disable getting public invitations.
    /*
    this._getPublicInvitations(userId).then(
      invitations => {
        res.status(200).send(invitations)
      }
    ).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })*/
  }

  setFinishDateOnExperiment = (req, res) => {
    this._populateExperimentDocumentForInfo(OTExperiment.findOneAndUpdate({
      _id: req.params.experimentId,
      manager: req.researcher.uid
    }, {
        finishDate: req.body.date
      }, { new: true })).lean().then(experiment => {
        res.status(200).send(experiment)
      }).catch(err => {
        console.error(err)
        res.status(500).send(err)
      })
  }

  getInvitations = (req, res) => {
    const researcherId = req.researcher.uid
    const experimentId = req.params.experimentId
    OTInvitation.find({ experiment: experimentId }).populate({ path: "participants", select: "_id dropped" }).lean().then(list => {
      res.status(200).json(list)
    })
      .catch(err => {
        res.status(500).send(err)
      })
  }

  removeInvitation = (req, res) => {
    const researcherId = req.researcher.uid
    const experimentId = req.params.experimentId
    const invitationId = req.params.invitationId
    OTInvitation.findOneAndRemove({ _id: invitationId, experiment: experimentId })
      .catch(err => {
        res.status(500).send(err)
      })
      .then(result => {
        console.log(result)
        app.socketModule().sendUpdateNotificationToExperimentSubscribers(experimentId, { model: SocketConstants.MODEL_INVITATION, event: SocketConstants.EVENT_REMOVED })
        res.status(200).send(true)
      })
  }

  addNewIntivation = (req, res) => {
    const researcherId = req.researcher.uid
    const experimentId = req.params.experimentId
    const data = req.body
    if (data.code == null) {
      const crypto = require("crypto");
      data["code"] = crypto.randomBytes(16).toString('base64')
    }

    data["experiment"] = experimentId
    new OTInvitation(data).save()
      .then(invit => invit.populate({ path: "participants", select: "_id dropped" }).execPopulate())
      .then(
        invit => {
          app.socketModule().sendUpdateNotificationToExperimentSubscribers(experimentId,
            { model: SocketConstants.MODEL_INVITATION, event: SocketConstants.EVENT_ADDED, payload: invit })

          res.status(200).json(invit.toJSON())
        }
      ).catch(err => {
        console.log(err)
        res.status(500).send(err)
      })
  }

  sendInvitation = (req, res) => {
    const invitationCode = req.body.invitationCode
    const userIds = req.body.userIds
    const force = req.body.force
    Promise.all(userIds.map(userId => app.researchModule().sendInvitationToUser(invitationCode, userId, force))).then(
      result => {
        res.status(200).send(result)
      }
    ).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }

  sendPushCommand = (req, res) => {
    const userIds = req.query.userIds
    const command = req.query.command
    app.pushModule().sendDataMessageToUser(userIds, new MessageData(command)).then(result => {
      res.status(200).send(result)
    }).catch(err => {
      res.status(500).send(err)
    })
  }

  updateTrackingPackageToExperiment = (req, res) => {
    if (!req.body.packageJson) {
      res.status(500).send("Did not send the package.")
    }

    const packageJson = req.body.packageJson
    const name = req.body.name
    const experimentId = req.params.experimentId
    const researcherId = req.researcher.uid
    const packageKey = req.body.packageKey

    const query = this.makeExperimentAndCorrespondingResearcherQuery(experimentId, researcherId)
    let update
    if (packageKey != null) {
      // update
      query["trackingPackages.key"] = packageKey
      update = {}
      if (name) {
        update["trackingPackages.$.name"] = name
      }

      if (packageJson) {
        update["trackingPackages.$.data"] = packageJson
      }
    } else {
      // insert
      update = {
        $push: {
          trackingPackages: {
            name: name,
            data: packageJson
          }
        }
      }
    }

    OTExperiment.findOneAndUpdate(query, update, { new: true }).then(doc => {
      if (doc) {
        res.status(200).send(true)
        app.socketModule().sendUpdateNotificationToExperimentSubscribers(experimentId, { model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_EDITED })
      } else {
        res.status(200).send(false)
      }
    }).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }

  removeTrackingPackageFromExperiment = (req, res) => {
    const experimentId = req.params.experimentId
    const packageKey = req.params.packageKey
    const researcherId = req.researcher.uid
    OTExperiment.findOneAndUpdate(this.makeExperimentAndCorrespondingResearcherQuery(experimentId, researcherId), {
      $pull: {
        trackingPackages: {
          key: packageKey
        }
      }
    }, { new: true }).then(updated => {
      if (updated != null && updated["groups"] instanceof Array) {
        let groupModified: boolean = null
        updated["groups"].filter(g => g.trackingPackageKey === packageKey).forEach(
          group => {
            group["trackingPackageKey"] = null
            groupModified = true
          }
        )

        if (groupModified === true) {
          updated.markModified("groups")
          return updated.save().then(result => {
            return true
          })
        }
        return true
      } else { return false }
    }).then(changed => {
      if (changed === true) {
        app.socketModule().sendUpdateNotificationToExperimentSubscribers(experimentId, { model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_EDITED })
      }
      res.status(200).send(changed)
    }).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }

  upsertExperimentGroup = (req, res) => {
    const experimentId = req.params.experimentId
    const researcherId = req.researcher.uid
    const query = this.makeExperimentAndCorrespondingResearcherQuery(experimentId, researcherId)
    let mongooseQuery: DocumentQuery<Document, Document>
    if (req.body._id) {
      // update
      query["groups._id"] = req.body._id
      const update = {}
      for (const key of Object.keys(req.body)) {
        if (key !== "_id") {
          update["groups.$." + key] = req.body[key]
        }
      }
      mongooseQuery = OTExperiment.findOneAndUpdate(query, update, { new: true, select: "groups" })
    } else {
      // insert
      const update = deepclone(req.body)
      delete update._id
      delete update.createdAt
      delete update.updatedAt
      mongooseQuery = OTExperiment.findOneAndUpdate(query, {
        $addToSet: {
          groups: update
        }
      }, { new: true, select: "groups" })
    }

    mongooseQuery.lean().then(found => {
      console.log(found)
      if (found) {
        if (req.body._id) {
          // update
          res.status(200).send(found["groups"].find(g => g._id === req.body._id))

        } else {
          // insert
          res.status(200).send(found["groups"].reverse().find(g => g.name === req.body.name))
        }
      } else {
        res.status(404).send(null)
      }
    }).catch(err => {
      res.status(500).send(err)
    })
  }

  removeExperimentGroup = (req, res) => {
    const experimentId = req.params.experimentId
    const researcherId = req.researcher.uid
    const groupId = req.params.groupId
    const query = this.makeExperimentAndCorrespondingResearcherQuery(experimentId, researcherId)
    query["groups._id"] = groupId
    OTExperiment.findOneAndUpdate(query, {
      $pull: {
        groups: {
          _id: groupId
        }
      }
    }).then(updatedExperiment => {
      if (updatedExperiment) {
        app.socketModule().sendUpdateNotificationToExperimentSubscribers(experimentId, { model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_EDITED })
        app.researchModule().dropOutImpl({ groupId: groupId }, true, true, null, researcherId)
          .then(
            result => {
              res.status(200).send(true)
            }
          )
      } else {
        res.status(404).send(false)
      }
    })
  }

  migrateUserTrackingEntitiesToExperiment = (req, res) => {
    const experimentId = req.params.experimentId
    const userId = req.params.userId
    if (userId != null && userId != "null" && experimentId != null && experimentId != "null") {

      const models = [OTTracker, OTTrigger]
      Promise.all(models.map(model=>{
        model.updateMany({user: userId, "flags.experiment": null}, {"flags.experiment": experimentId}).then(result => {
          console.log(result)
          return {count: result.n}
        })
      })).then(result => {
        res.status(200).send(result)
      })
    } else {
      res.status(500).send("You did not properly insert the user id and experiment id.")
    }
  }
}

const experimentCtrl = new OTExperimentCtrl()
export { experimentCtrl }