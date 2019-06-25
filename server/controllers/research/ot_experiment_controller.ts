import OTUser, { USER_PROJECTION_EXCLUDE_CREDENTIAL } from '../../models/ot_user'
import OTTrigger from '../../models/ot_trigger'
import OTTracker from '../../models/ot_tracker'
import OTItem from '../../models/ot_item';
import OTResearcher from '../../models/ot_researcher'
import OTExperiment from '../../models/ot_experiment'
import OTInvitation from '../../models/ot_invitation'
import otUsageLogCtrl from '../ot_usage_log_controller';
import { ExperimentPermissions, IJoinedExperimentInfo } from '../../../omnitrack/core/research/experiment'
import { Document, DocumentQuery } from 'mongoose';
import app from '../../app';
import { SocketConstants } from '../../../omnitrack/core/research/socket';
import { MessageData, ExperimentData } from '../../modules/push.module';
import { deepclone } from '../../../shared_lib/utils';
import { clientBuildCtrl } from './ot_client_build_controller';
import { userCtrl } from '../ot_user_controller';
import C from '../../server_consts';
import { IUserDbEntity } from '../../../omnitrack/core/db-entity-types';
import { generateNewPackageKey } from '../../models/ot_experiment';


export default class OTExperimentCtrl {

  checkResearcherPermitted(researcherId: string, experimentId: string): Promise<boolean> {
    return OTExperiment.findOne(this.makeExperimentAndCorrespondingResearcherQuery(experimentId, researcherId), { _id: 1 })
      .lean().then(exp => exp != null)
  }

  makeExperimentAndCorrespondingResearcherQuery(experimentId: string, researcherId: string): any {
    return {
      _id: experimentId,
      $or: [{ manager: researcherId }, { "experimenters.researcher": researcherId }]
    }
  }

  makeExperimentsOfResearcherQuery(researcherId: string): any {
    return { $or: [{ manager: researcherId }, { "experimenters.researcher": researcherId }] }
  }

  getResearcherInfosOfExperiment(experimentId: string): Promise<Array<{ isManager: boolean, id: string }>> {
    return OTExperiment.findById(experimentId, { _id: 1, experimenters: 1, manager: 1 }).lean().then(
      experiment => {
        if (experiment) {
          const result = []
          result.push({ isManager: true, id: experiment.manager })
          if (experiment.experimenters) {
            experiment.experimenters.forEach(e => result.push({ isManager: false, id: e.researcher }))
          }
          return result
        } else {
          return []
        }
      }
    )
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
        return Promise.all([OTTracker, OTTrigger, OTItem].map(model => {
          return model.deleteMany({
            "user.experiment": experimentId
          })
        })).then(result => {
          return OTUser.find({ experiment: experimentId }, { _id: 1 }).then(participants => {
            app.pushModule().sendDataMessageToUser(participants.map(r => r._id),
              new MessageData(C.PUSH_DATA_TYPE_SIGN_OUT)).then(
                messageResult => {
                  console.log(messageResult)
                })

            return Promise.all([OTUser.remove({ experiment: experimentId }), OTInvitation.remove({ experiment: experimentId }), clientBuildCtrl.handleExperimentRemoval(experimentId)]).then(
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
    OTUser.find({ experiment: experimentId }, USER_PROJECTION_EXCLUDE_CREDENTIAL).lean()
      .then(
        participants => {
          res.status(200).send(participants)
        }
      ).catch(err => {
        console.error(err)
        res.status(500).send(err)
      })
  }

  getSessionSummary = (req, res) => {
    const experimentId = req.params.experimentId
    const userIds = req.query.userIds
    otUsageLogCtrl.analyzeSessionSummary(null, userIds, experimentId).then(
      usageLogAnalysisResults => {
        /*
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
        })*/

        res.status(200).send(usageLogAnalysisResults)
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
    OTExperiment.find(this.makeExperimentsOfResearcherQuery(researcherId), { _id: 1, name: 1, manager: 1, experimenters: 1, finishDate: 1, createdAt: 1 })
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

  getPublicInvitationList = (req, res) => {
    const userId = req.user.uid
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
      console.error("Did not send the package.")
      res.status(500).send("Did not send the package.")
      return
    }

    const packageJson = req.body.packageJson
    const name = req.body.name
    const experimentId = req.params.experimentId
    const researcherId = req.researcher.uid
    let packageKey = req.body.packageKey

    const query = this.makeExperimentAndCorrespondingResearcherQuery(experimentId, researcherId)
    let update
    if (packageKey != null) {
      // update
      query["trackingPlans.key"] = packageKey
      update = {}
      if (name) {
        update["trackingPlans.$.name"] = name
      }

      if (packageJson) {
        update["trackingPlans.$.data"] = packageJson
      }
    } else {
      // insert
      packageKey = generateNewPackageKey()
      update = {
        $push: {
          trackingPlans: {
            key: packageKey,
            name: name,
            data: packageJson
          }
        }
      }
    }

    OTExperiment.findOneAndUpdate(query, update, { new: true }).lean().then(doc => {
      if (doc) {
        res.status(200).send({success: true, packageKey: packageKey})
        app.socketModule().sendUpdateNotificationToExperimentSubscribers(experimentId, { model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_EDITED })
      } else {
        res.status(200).send({success: false, packageKey: null})
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
        trackingPlans: {
          key: packageKey
        }
      }
    }, { new: true }).then(updated => {
      if (updated != null && updated["groups"] instanceof Array) {
        let groupModified: boolean = null
        updated["groups"].filter(g => g.trackingPlanKey === packageKey).forEach(
          group => {
            group["trackingPlanKey"] = null
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
        this.dropOutImpl({ groupId: groupId }, true, true, null, researcherId)
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
      Promise.all(models.map(model => {
        model.updateMany({ user: userId, "flags.experiment": null }, { "flags.experiment": experimentId }).then(result => {
          console.log(result)
          return { count: result.n }
        })
      })).then(result => {
        res.status(200).send(result)
      })
    } else {
      res.status(500).send("You did not properly insert the user id and experiment id.")
    }
  }

  sendTriggerPingTest = (req, res) => {
    const researcherId = req.researcher.uid
    const experimentId = req.params.experimentId
    const triggerId = req.body.triggerId

    this.checkResearcherPermitted(researcherId, experimentId).then(permitted => {
      if (permitted === true) {
        OTTrigger.findOne({
          _id: triggerId,
          "flags.experiment": experimentId
        }, { _id: 1, user: 1 }).lean().then(
          trigger => {
            if (trigger) {
              app.pushModule().sendDataMessageToUser
                (trigger["user"], new ExperimentData(C.PUSH_DATA_TYPE_TEST_TRIGGER_PING, experimentId, { "triggerId": triggerId })).then(
                  pushResult => {
                    console.log("A test ping was sent to the participant.")
                    res.status(200).send(true)
                  }
                ).catch(ex => {
                  console.error(ex)
                  res.status(500).send(ex)
                })
            } else {
              res.status(404).send("No trigger was found.")
            }
          }
        )
      } else {
        res.status(401).send("Experiment is not permitted to the researcher.")
      }
    })
  }

  changeParticipantAlias = (req, res) => {
    const participantId = req.params.participantId
    const alias = req.body.alias
    OTUser.findById(participantId, { experiment: 1 }).lean().then(participant => {
      if (participant != null) {
        return OTUser.findOne({ _id: { $ne: participantId }, "participationInfo.alias": alias, experiment: participant.experiment }).then(doc => {
          if (doc) {
            return Promise.reject("AliasAlreadyExists");
          } else {
            return OTUser.findByIdAndUpdate(participantId, { "participationInfo.alias": alias }, { select: "_id participationInfo.alias experiment" }).then(old => {
              const changed = old["participationInfo"]["alias"] !== alias
              if (changed === true) {
                app.socketModule().sendUpdateNotificationToExperimentSubscribers(old["experiment"], { model: SocketConstants.MODEL_USER, event: SocketConstants.EVENT_EDITED })
              }

              return changed
            })
          }
        })
      }
      else return false
    })
      .then(
        changed => {
          res.status(200).send(changed)
        }
      ).catch(
        err => {
          console.log(err)
          res.status(500).send({ error: err })
        }
      )
  }

  getUsersWithPariticipantInformation = (req, res) => {
    OTUser.find({}).populate({
      path: 'participantIdentities',
      select: '_id invitation dropped',
      populate: {
        path: 'invitation',
        select: '_id experiment code',
        populate: {
          path: 'experiment',
          select: '_id name'
        }
      }
    }).lean().then(list => {
      res.status(200).send(list)
    }).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }


  getExperimentConsentInfo = (req, res) => {
    const experimentId = req.params.experimentId || res.locals.experimentId
    OTExperiment.findOne({
      _id: experimentId
    }, {
        consent: 1,
        receiveConsentInApp: 1,
        demographicFormSchema: 1
      }).lean().then(
        exp => {
          if (exp) {
            res.status(200).send(exp)
          } else {
            res.status(404).send("No such experiment.")
          }
        }
      )
  }

  sendNotificationMessageToUser = (req, res) => {
    const researcher = req.researcher
    const userId: string | string[] = req.body.userId
    const title: string = req.body.title
    const message: string = req.body.message
    const payload: any = req.body.payload
    payload.sent_by_name = researcher.email
    app.pushModule().sendNotificationMessageToUser(userId, title, message, payload).then(
      result => {
        res.status(200).send(result)
      }
    ).catch(err => {
      res.status(500).send(err)
    })
  }


  dropOutFromExperiment = (req, res) => {
    let userId: string
    let researcherId: string = null
    if (req.researcher) {
      // researcher mode
      researcherId = req.researcher.uid
      userId = req.params.participantId
    } else if (req.user) {
      // user mode
      userId = req.user.uid
    } else {
      res.status(500).send("UnAuthorized from either side.")
      return
    }

    const reason = req.body.reason

    let promise: Promise<any>

    if (researcherId) {
      promise = this.dropOutImpl({ _id: userId }, false, false, reason, researcherId)
    } else if (userId) {
      promise = this.dropOutImpl({ _id: userId }, false, false, reason, researcherId)
    }

    promise.then(result => {
      res.status(200).send(result)
    })
      .catch(err => {
        console.log("Dropout err:")
        console.log(err)
        res.status(500).send(err)
      })
  }


  private handleParticipantDropout(search: any, multiple: boolean, remove: boolean, reason?: string, researcherId?: string): Promise<Array<IUserDbEntity>> {
    if (multiple === true) {
      return OTUser.find(search, USER_PROJECTION_EXCLUDE_CREDENTIAL).populate({ path: "experiment", select: "_id name" }).lean().then(docs => {
        if (remove === true) {
          return OTUser.deleteMany(search).then(removeRes => docs)
        } else {
          search["participationInfo.dropped"] = { $ne: true }
          return OTUser.updateMany(search, {
            "participationInfo.dropped": true,
            "participationInfo.droppedBy": researcherId,
            "participationInfo.droppedReason": reason,
            "participationInfo.droppedAt": new Date()
          }).then(res => docs)
        }
      }).then(res => res as any as Array<IUserDbEntity>)
    } else {
      if (remove === true) {
        return OTUser.findOneAndRemove(search).populate({ path: "experiment", select: "_id name" }).then(removed => removed ? [removed as any as IUserDbEntity] : [])
      } else {
        search["participationInfo.dropped"] = { $ne: true }

        return OTUser.findOneAndUpdate(search, {
          "participationInfo.dropped": true,
          "participationInfo.droppedBy": researcherId,
          "participationInfo.droppedReason": reason,
          "participationInfo.droppedAt": new Date()
        }, { new: true, projection: USER_PROJECTION_EXCLUDE_CREDENTIAL }).populate({ path: "experiment", select: "_id name" }).then(participant => {
          return participant ? [participant as any as IUserDbEntity] : []
        })
      }
    }
  }

  private dropOutImpl(search: any, multiple: boolean, remove: boolean, reason?: string, researcherId?: string): Promise<{ success: boolean, injectionExists?: boolean, error?: string, experiment?: IJoinedExperimentInfo } | Array<{ success: boolean, injectionExists?: boolean, error?: string, experiment?: IJoinedExperimentInfo }>> {
    const droppedDate = new Date()
    return this.handleParticipantDropout(search, multiple, remove, reason, researcherId).then(
      participants => {

        if (participants.length === 0) {
          return Promise.resolve({ success: false, injectionExists: false, error: "Not participating in the experiment.", experiment: null })
        }

        return Promise.all(participants.map(participant => {
          const experiment = participant["experiment"]
          return userCtrl.deleteAllAssetsOfUser(participant._id).then(objRemovalResult => {
            console.log(objRemovalResult)
            app.pushModule().sendDataMessageToUser(participants.map(r => r._id),
              new MessageData(C.PUSH_DATA_TYPE_SIGN_OUT)).then(
                messageResult => {
                  console.log(messageResult)
                })
            /*
            const changedResults = objRemovalResult.filter(r => r.changed === true)
            if (changedResults.length > 0) {
              app.serverModule().registerMessageDataPush(participant._id, app.pushModule().makeSyncMessageFromTypes(
                changedResults.map(r => r.syncType)
              ))
            }*/

            app.socketModule().sendUpdateNotificationToExperimentSubscribers(experiment._id, { model: SocketConstants.MODEL_USER, event: SocketConstants.EVENT_DROPPED, payload: { participant: participant } })

            app.serverModule().registerMessageDataPush(participant._id, new ExperimentData(C.PUSH_DATA_TYPE_EXPERIMENT_DROPPED, experiment._id, { droppedBySelf: (participant["droppedBy"] == null).toString() }))

            return { success: true, experiment: { id: experiment._id.toString(), name: experiment.name.toString(), injectionExists: null, joinedAt: participant["approvedAt"] ? participant["approvedAt"].getTime() : null, droppedAt: droppedDate.getTime() } }
          })
        })).then(results => {
          if (multiple === true) {
            return results
          } else { return results[0] }
        }) as any
      }
    )
  }
}

const experimentCtrl = new OTExperimentCtrl()
export { experimentCtrl }