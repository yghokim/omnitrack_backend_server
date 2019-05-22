import * as mongoose from 'mongoose';
import * as fs from 'fs-extra';
import OTUser, { USER_PROJECTION_EXCLUDE_CREDENTIAL } from '../models/ot_user';
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
import OTResearcher from '../models/ot_researcher';
import C from '../server_consts';
import './ot_experiment_participation_pipeline_helper';
import { selfAssignParticipantToExperiment, researcherAssignParticipantToExperiment } from './ot_experiment_participation_pipeline_helper';
import OTItemMedia from '../models/ot_item_media';

export class OTUserCtrl extends OTAuthCtrlBase {

  private getExperimentIdCompat(request: any) {
    return request.body.experimentId || request.params.experimentId || request["OTExperiment"]
  }

  constructor() {
    super(OTUser, "user", 'username', ["name", "picture"])
  }

  protected modifyJWTSchema(user: any, tokenSchema: import("./ot_auth_controller").JwtTokenSchemaBase): void {
    const schema = tokenSchema as any
    schema.picture = user.picture
  }

  protected modifyNewAccountSchema(schema: any, request: any) {

    /*
    const googleUserId = req.user.uid
    const experimentId = res.locals.experimentId || req["OTExperiment"] || req.body.experimentId
    const invitationCode = req.body.invitationCode
    const deviceInfo = req.body.deviceInfo
    const demographic = req.body.demographic
     */
    schema.experiment = this.getExperimentIdCompat(request)
  }

  protected onPreRegisterNewUserInstance(user: any, request: Request): Promise<any> {
    const experimentId = this.getExperimentIdCompat(request)
    const invitationCode = request.body.invitationCode
    const deviceInfo = request.body.deviceInfo
    const demographic = request.body.demographic
    const overrideAlias = request.body.alias

    return deferPromise(() => {
      if (experimentId != null) {
        if (invitationCode != null) {
          // check invitation code and experimentId
          return experimentCtrl.matchInvitationWithExperiment(invitationCode, experimentId).then(match => {
            if (match === true) {
              return selfAssignParticipantToExperiment(user, invitationCode, experimentId, demographic).then(joinedExperimentInfo => {
                return user
              })
            } else { throw { error: C.ERROR_CODE_ILLEGAL_INVITATION_CODE } }
          })
        } else {
          //inserted an experimentId, but not invidation code
          //two cases, where the researcher created the account / or the user inserted wrong invitation code.
          if (request["researcher"]) {
            return researcherAssignParticipantToExperiment(user, experimentId, request.body.groupId, overrideAlias, demographic).then(joinedExperimentInfo => {
              return user
            })
          } else {
            throw { error: C.ERROR_CODE_ILLEGAL_INVITATION_CODE }
          }
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
        model: SocketConstants.MODEL_USER, event: request["researcher"] == null ? SocketConstants.EVENT_APPROVED : SocketConstants.EVENT_ADDED, payload: {
          user: user._id
        }
      })
    }
    return super.onAfterRegisterNewUserInstance(user, request)
  }

  protected processRegisterResult(user: IUserDbEntity, request: Request): Promise<{ user: any, resultPayload?: any }> {
    let resultPayload = null
    if (request.body.deviceInfo) {
      const device = user.devices.find(device => device.deviceId === request.body.deviceInfo.deviceId)
      if (device != null) {
        resultPayload = {
          deviceLocalKey: device.localKey
        }
      }
    }

    return Promise.resolve({
      user: user,
      resultPayload: resultPayload
    })
  }


  protected makeUserIndexQueryObj(request: Request): any {
    return {
      username: request.body.username,
      experiment: this.getExperimentIdCompat(request),
      "participationInfo.dropped": { $ne: true }
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

  public deleteAllAssetsOfUser(userId: string): Promise<void>{
    return Promise.all([OTItem, OTTracker, OTTrigger, OTItemMedia].map(model => model.deleteMany({user: userId}))).then(result => fs.remove(app.serverModule().makeUserMediaDirectoryPath(userId)))
  }

  deleteAccount = (req, res) => {
    let userId
    if (req.researcher) {
      // researcher mode
      userId = req.params.participantId
    } else if (req.user) {
      userId = req.user.uid
    } else {
      res.status(500).send({ err: "You are neither a researcher nor a user." })
    }

    this.deleteAllAssetsOfUser(userId)
      .then(results => OTUser.findOneAndDelete({_id: userId}, {projection: USER_PROJECTION_EXCLUDE_CREDENTIAL}))
      .then(user => {
        app.socketModule().sendUpdateNotificationToExperimentSubscribers(user["experiment"], { model: SocketConstants.MODEL_USER, event: SocketConstants.EVENT_REMOVED })

        res.status(200).send(user != null)
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
const userCtrl = new OTUserCtrl()
export { userCtrl }