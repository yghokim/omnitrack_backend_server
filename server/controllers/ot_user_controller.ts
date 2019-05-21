import BaseCtrl from './base';
import * as mongoose from 'mongoose';
import OTUser from '../models/ot_user';
import OTItem from '../models/ot_item';
import OTTracker from '../models/ot_tracker';
import OTTrigger from '../models/ot_trigger';
import OTUserReport from '../models/ot_user_report';
import InformationUpdateResult from '../../omnitrack/core/information_update_result';
import app from '../app';
import { SocketConstants } from '../../omnitrack/core/research/socket';
import { experimentCtrl } from './research/ot_experiment_controller';
import { IUserDbEntity, IClientDevice } from '../../omnitrack/core/db-entity-types';
import { deferPromise } from '../../shared_lib/utils';
import { OTAuthCtrlBase } from './ot_auth_controller';
import { Request } from 'express';
import * as moment from 'moment';
import OTResearcher from '../models/ot_researcher';
import OTInvitation from '../models/ot_invitation';
import { AInvitation } from '../../omnitrack/core/research/invitation';
import { IJoinedExperimentInfo } from '../../omnitrack/core/research/experiment';
import OTExperiment from '../models/ot_experiment';
import C from '../server_consts';

export default class OTUserCtrl extends OTAuthCtrlBase {

  constructor() {
    super(OTUser, "user", 'username', ["name", "picture"])
  }

  protected modifyJWTSchema(user: any, tokenSchema: import("./ot_auth_controller").JwtTokenSchemaBase): void {
    const schema = tokenSchema as any
    schema.picture = user.picture
  }
  protected modifyNewAccountSchema(schema: any, requestBody: any) {

    /*
    const googleUserId = req.user.uid
    const experimentId = res.locals.experimentId || req["OTExperiment"] || req.body.experimentId
    const invitationCode = req.body.invitationCode
    const deviceInfo = req.body.deviceInfo
    const demographic = req.body.demographic
*/
    schema.name = requestBody.name
  }

  protected onPreRegisterNewUserInstance(user: any, request: Request): Promise<any> {
    const experimentId = request.body.experimentId || request["OTExperiment"]
    const invitationCode = request.body.invitationCode
    const deviceInfo = request.body.deviceInfo
    const demographic = request.body.demographic

    return deferPromise(() => {
      if (experimentId != null) {
        if (invitationCode != null) {
          // check invitation code and experimentId
          return experimentCtrl.matchInvitationWithExperiment(invitationCode, experimentId).then(match => {
            if (match === true) {
              return this._assignParticipantToExperiment(user, invitationCode, experimentId, demographic).then(joinedExperimentInfo => {
                return user
              })
            } else { throw { error: C.ERROR_CODE_ILLEGAL_INVITATION_CODE } }
          })
        } else {
          //inserted an experimentId, but not invidation code
          throw { error: C.ERROR_CODE_ILLEGAL_INVITATION_CODE }
        }
      } else {
        //no experimentId. check email account.
        return OTResearcher.findOne({
          email: user.username,
          account_approved: true
        }, { _id: 1, alias: 1 }).lean().then(researcher => {
          if (researcher != null) {
            //found matching researcher.
            console.log("A researcher " + researcher.alias + " was signed in as a master app user.")
            return user
          } else throw {
            error: "UsernameNotMatchResearcher"
          }
        })
      }
    }).then(user => {
      if (deviceInfo != null) {
        this.upsertDeviceInfoLocally(user, deviceInfo)
      }
      return user
    })
  }

  protected onAfterRegisterNewUserInstance(user: any, request: Request): Promise<any> {
    if (user.experiment != null) {
      app.socketModule().sendUpdateNotificationToExperimentSubscribers(user.experiment, {
        model: SocketConstants.MODEL_USER, event: SocketConstants.EVENT_APPROVED, payload: {
          user: user._id
        }
      })
    }
    return super.onAfterRegisterNewUserInstance(user, request)
  }

  protected processRegisterResult(user: any, request: Request): Promise<{user: any, resultPayload?: any}>{
    return Promise.resolve({
      user: user,
    })
  }
  private _assignParticipantToExperiment(user: IUserDbEntity, invitationCode: string, experimentId: string, demographic: any): Promise<IJoinedExperimentInfo> {
    return OTInvitation.findOne({
      code: invitationCode,
      experiment: experimentId,
      $or: [
        { "experiment.finishDate": { $gt: new Date() } },
        { "experiment.finishDate": null }
      ]
    }, { _id: 1, experiment: 1, groupMechanism: 1 }).lean()
      .then(doc => {
        if (doc) {
          const typedInvitation = AInvitation.fromJson((doc as any).groupMechanism)
          const groupId = typedInvitation.pickGroup()
          return { invitationId: doc._id, experimentId: doc["experiment"], groupId: groupId }
        } else {
          throw { error: "IllegalInvitationCodeOrClosedExperiment" }
        }
      })
      .then(result => {
        return OTExperiment.findOneAndUpdate({
          _id: result.experimentId,
          "groups._id": result.groupId,
        }, { $inc: { participantNumberSeed: 1 } }, { new: true, select: { _id: 1, name: 1, participantNumberSeed: 1, groups: 1, trackingPackages: 1 } })
          .lean()
          .then(experiment => {
            let trackingPackage
            const group = experiment.groups.find(g => g._id === result.groupId)
            if (group.trackingPackageKey) {
              trackingPackage = (experiment.trackingPackages || []).find(p => p.key === group.trackingPackageKey)
            }

            user.name =
              user.participationInfo.groupId = result.groupId
            user.participationInfo.alias = "P" + experiment["participantNumberSeed"]
            user.participationInfo.invitation = result.invitationId
            user.participationInfo.dropped = false
            user.participationInfo.droppedAt = null
            user.participationInfo.droppedBy = null
            user.participationInfo.demographic = demographic
            const now = Date()
            user.participationInfo.approvedAt = now as any
            user.participationInfo.experimentRange.from = now as any

            const joinedExperimentInfo = {
              id: experiment._id,
              name: experiment.name,
              droppedAt: null,
              joinedAt: user.participationInfo.approvedAt.getTime()
            } as IJoinedExperimentInfo

            if (trackingPackage) {
              //inject tracking package
              return app.omnitrackModule().injectPackage(user._id, trackingPackage.data,
                { injected: true, experiment: experiment._id }).then(res => {
                  return joinedExperimentInfo
                })
            } else {
              //not inject tracking package
              return joinedExperimentInfo
            }
          })
      })
  }

  protected makeUserIndexQueryObj(request: Request): any {
    return {
      username: request.body.username,
      experiment: request.body.experimentId || request["OTExperiment"]
    }
  }

  _checkExperimentParticipationStatus(uid: string, experimentId: string): Promise<boolean> {
    return OTUser.findOne({
      _id: uid,
      experiment: experimentId,
      "participationInfo.dropped": false
    }, { _id: 1 }).lean().then(user => {
      return user != null
    })
  }

  getParticipationStatus = (req, res) => {
    const userId = req.user.uid
    const experimentId = req.params.experimentId
    this._checkExperimentParticipationStatus(userId, experimentId).then(
      isInParticipation => {
        res.status(200).send(isInParticipation)
      }
    ).catch(err => {
      console.error(err)
      res.status(500).send(err)
    })
  }

  /**
   *
   *
   * @private
   * @param {IUserDbEntity} user
   * @param {IClientDevice} deviceInfo
   * @returns {boolean} whether the deviceInfo was newly inserted or not
   * @memberof OTUserCtrl
   */
  private upsertDeviceInfoLocally(user: IUserDbEntity, deviceInfo: IClientDevice): { inserted: boolean, localKey: number } {
    let updated = false
    let localKey = null
    const matchedDevice = user.devices.find(device => device.deviceId === deviceInfo.deviceId)
    if (matchedDevice != null) {
      localKey = matchedDevice.localKey
      if (matchedDevice.localKey == null) {
        localKey = (user.deviceLocalKeySeed || 0) + 1
        matchedDevice.localKey = localKey
        user.deviceLocalKeySeed++
      }

      matchedDevice.deviceId = deviceInfo.deviceId
      matchedDevice.instanceId = deviceInfo.instanceId
      matchedDevice.appVersion = deviceInfo.appVersion
      matchedDevice.firstLoginAt = deviceInfo.firstLoginAt
      matchedDevice.os = deviceInfo.os

      updated = true
    } else {
      localKey = (user.deviceLocalKeySeed || 0) + 1
      deviceInfo.localKey = localKey
      user.deviceLocalKeySeed++
      user.devices.push(deviceInfo)

      updated = false
    }
    return { inserted: !updated, localKey: localKey }
  }

  postReport = (req, res) => {
    const reportData = req.body
    const newReport = new OTUserReport({ _id: mongoose.Types.ObjectId(), data: reportData })
    if (reportData.anonymous === true) {
      console.log("received the anonymized report")
    } else {
      console.log("received the de-anonymized report")
      newReport["user"] = req.user.uid
    }

    newReport.save().then(
      result => {
        res.status(200).send(true)
      }
    ).catch(err => {
      console.log(err)
      res.status(500).send({ error: err })
    })
  }

  putUserName = (req, res) => {
    const userId = req.user.uid
    const name = req.body.value
    const timestamp = req.body.timestamp
    OTUser.findOneAndUpdate({
      _id: userId,
      $or: [
        { nameUpdatedAt: { $exists: false } },
        { nameUpdatedAt: { $lt: timestamp } }
      ]
    }, { name: name, nameUpdatedAt: Date.now() }, { new: true, select: { name: true, nameUpdatedAt: true } }).lean().then(user => {
      if (user) {
        res.json(<InformationUpdateResult>{ success: true, finalValue: user["name"], payloads: new Map([["updatedAt", user["nameUpdatedAt"].getTime().toString()]]) })
      } else {
        res.json(<InformationUpdateResult>{ success: false })
      }
    }).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }

  getDevices = (req, res) => {
    const userId = req.user.uid
    OTUser.findOne({ _id: userId }, { projection: { devices: true } }).lean().then(
      result => {
        if (result == null) {
          res.json([])
        } else { res.json(result["devices"] || []) }
      }
    ).catch(
      error => {
        console.log(error)
        res.status(500).send(error)
      }
    )
  }

  upsertDeviceInfo = (req, res) => {
    const userId = req.user.uid
    const deviceInfo = req.body
    OTUser.findById(userId).then(
      user => {
        const deviceInsertionResult = this.upsertDeviceInfoLocally(user as any, deviceInfo);
        user.save(err => {
          console.log(err)
          if (err == null) {
            res.json({
              result: deviceInsertionResult.inserted === true ? "updated" : "added",
              deviceLocalKey: deviceInsertionResult.localKey.toString(16)
            })
          } else { res.status(500).send({ error: "deviceinfo db update failed." }) }
        })
      }
    )
  }

  deleteAccount = (req, res) => {
    let userId
    if (req.researcher) {
      // researcher mode
      userId = req.params.userId
    } else if (req.user) {
      userId = req.user.uid
    } else {
      res.status(500).send({ err: "You are neither a researcher nor a user." })
    }

    const removeData = JSON.parse(req.query.removeData || "false")

    const promises: Array<PromiseLike<any>> = [
      OTUser.collection.findOneAndDelete({ _id: userId }).then(result => {
        return { name: OTUser.modelName, result: result.ok > 0, count: 1 }
      })
    ]

    if (removeData) {
      [OTItem, OTTracker, OTTrigger].forEach(model => {
        promises.push(
          model.remove({ user: userId }).then(removeRes => ({ name: model.modelName, result: removeRes["ok"] > 0, count: removeRes["n"] }))
        )
      })
    }

    Promise.all(promises)
      .then(results => {
        console.log(results)
        app.socketModule().sendGlobalEvent(results.filter(r => r.count > 0).map(r => {
          return { model: r.name, event: SocketConstants.EVENT_REMOVED }
        }))
        res.status(200).send(results)
      }).catch(err => {
        console.log(err)
        res.status(500).send(err)
      })

  }

  protected onAuthenticate(user: any, request: Request): Promise<{
    user: any,
    resulyPayload?: any
  }> {
    const deviceInfo = request.body.deviceInfo
    const result = this.upsertDeviceInfoLocally(user, deviceInfo)
    return user.save().then(user => ({
      user: user,
      resultPayload: {
        deviceLocalKey: result.localKey
      }
    }))
  }

  verifyInvitationCode = (req, res) => {
    const experimentId = req.params.experimentId
    const invitationCode = req.query.invitationCode
    experimentCtrl.matchInvitationWithExperiment(invitationCode, experimentId).then(
      verified => {
        res.status(200).send(verified)
      }
    ).catch(err => {
      console.error(err)
      res.status(500).send(err)
    })
  }

  signOut = (req, res) => {
    const userId = req.user.uid
    const deviceInfo = req.body.deviceInfo
    if (userId != null && deviceInfo != null) {
      OTUser.findByIdAndUpdate(userId, {
        $pull: {
          devices: {
            deviceId: deviceInfo.deviceId
          }
        }
      }).then(user => {
        res.status(200).send(true)
      }).catch(err => {
        res.status(500).send(err)
      })
    } else {
      console.log("illegal arguments.")
      res.status(401).send({
        error: C.ERROR_CODE_ILLEGAL_ARTUMENTS
      })
    }
  }

}