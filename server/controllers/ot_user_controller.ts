import * as mongoose from 'mongoose';
import * as fs from 'fs-extra';
import OTUser, { USER_PROJECTION_EXCLUDE_CREDENTIAL } from '../models/ot_user';
import OTItem from '../models/ot_item';
import OTTracker from '../models/ot_tracker';
import OTTrigger from '../models/ot_trigger';
import OTUserReport from '../models/ot_user_report';
import { messageCtrl } from './research/ot_message_controller';
import InformationUpdateResult from '../../omnitrack/core/information_update_result';
import app from '../app';
import env from '../env';
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
import moment = require('moment');

export class OTUserCtrl extends OTAuthCtrlBase {

  private getExperimentIdCompat(request: any) {
    return request.body.experimentId || request.params.experimentId || request.get("OTExperiment")
  }

  constructor() {
    super(OTUser, "user", 'username', ["name", "picture", "email"])
  }

  protected modifyJWTSchema(user: any, tokenSchema: import("./ot_auth_controller").JwtTokenSchemaBase): void {
    const schema = tokenSchema as any
    schema.picture = user.picture
    schema.email = user.email
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
    const email = request.body.email

    user.email = email

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
          email: user.email,
          account_approved: true
        }, { _id: 1, alias: 1 }).lean().then(researcher => {
          if (researcher != null) {
            //found matching researcher.
            console.log("A researcher " + researcher.alias + " was signed in as a master app user.")
            return user
          } else throw {
            error: C.ERROR_CODE_USERNAME_NOT_MATCH_RESEARCHER
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
          deviceLocalKey: device.localKey,
          appFlags: user.appFlags
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

  getAppFlags = (req, res) => {
    const userId = req.user.uid
    //check researcher
    OTUser.findById(userId, { appFlags: 1 }).lean().then(user => {
      if (user) {
        res.status(200).send(user.appFlags)
      } else {
        res.status(404).send({
          error: C.ERROR_CODE_ACCOUNT_NOT_EXISTS
        })
      }
    })
  }

  /*
  getAppFlags = (req, res) => {
    const userId = req.user.uid
    //check researcher
    OTUser.findById(userId, { username: 1, "participationInfo.groupId": 1, experiment: 1 }).lean().then(user => {
      if (user) {
        if (user.experiment) {
          OTExperiment.findOne({ _id: user.experiment, "groups._id": user.participationInfo.groupId }, { trackingPlans: 1, groups: 1 }).lean().then(
            experiment => {
              if (experiment) {
                if (experiment.trackingPlans && experiment.trackingPlans.length > 0) {
                  const plan = experiment.trackingPlans.find(p =>p.key === experiment.groups[0].trackingPlanKey)
                  if(plan && plan.app && plan.app.lockedProperties){
                    res.status(200).send(plan.app.lockedProperties)
                  }else{
                    res.status(200).send(OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.App, true))
                  }
                } else { // no tracking plans are assigned.
                  res.status(200).send(OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.App, true))
                }
              } else {
                res.status(500).send({
                  error: C.ERROR_CODE_ILLEGAL_ARGUMENTS
                })
              }
            }
          )
        } else {
          OTResearcher.findOne({ email: user.username }, "_id").countDocuments().then(count => {
            if (count > 0) {
              res.status(200).send(OmniTrackFlagGraph.generateFlagWithDefault(DependencyLevel.App, true))
            } else {
              res.status(401).send({
                error: C.ERROR_CODE_USERNAME_NOT_MATCH_RESEARCHER
              })
            }
          })
        }
      } else {
        res.status(404).send({
          error: C.ERROR_CODE_ACCOUNT_NOT_EXISTS
        })
      }
    })
  }*/

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
    const newReport = new OTUserReport({ _id: mongoose.Types.ObjectId(), data: reportData } as any)
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

  public deleteAllAssetsOfUser(userId: string): Promise<void> {
    return Promise.all([OTItem, OTTracker, OTTrigger, OTItemMedia].map(model => model.deleteMany({ user: userId }))).then(result => fs.remove(app.serverModule().makeUserMediaDirectoryPath(userId)))
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
      .then(results => OTUser.findOneAndDelete({ _id: userId }, { projection: USER_PROJECTION_EXCLUDE_CREDENTIAL }))
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
    resultPayload?: any
  }> {
    const deviceInfo = request.body.deviceInfo
    const result = this.upsertDeviceInfoLocally(user, deviceInfo)
    console.log("user authenticated. device info: ", JSON.stringify(deviceInfo))
    console.log("device upsert result: ", JSON.stringify(result))
    return user.save().then(user => ({
      user: user,
      resultPayload: {
        deviceLocalKey: result.localKey,
        appFlags: user.appFlags
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

  issuePasswordResetTokenOfUser(query: any): Promise<String> {
    return OTUser.findOne(query).then(user => {
      if (user) {
        const token = require('randomstring').generate(128)
        user["password_reset_token"] = token
        user["reset_token_expires"] = moment().add(12, 'hour').toDate()
        return user.save().then(() => token)
      } else {
        throw { error: C.ERROR_CODE_ACCOUNT_NOT_EXISTS }
      }
    })
  }

  requestPasswordResetLinkToEmail = (req: Request, res) => {
    const username = req.body.username
    const experimentId = this.getExperimentIdCompat(req)
    const appName = req.body.appName
    const userQuery = { username: username, experiment: experimentId }

    this.issuePasswordResetTokenOfUser(userQuery)
      .then(
        token => {
          const resetUrl = (env.frontend_host + "/user/reset_password?token=" + token)

          const format = require('string-format')
          const mailFormat = "<h3>Reset your Password?</h3> <p>If you requested a password reset for <b>{username}</b> in <b>{appName}</b>, visit the link below. If you didn't make this request, ignore this email.</p> {resetUrl}"

          return OTUser.findOne(userQuery, { email: 1 }).lean().then(user => {
            console.log("send a password reset mail to user : ", user)
            return messageCtrl.sendEmailTo("Password Reset Request", format(mailFormat, {
              appName: appName,
              username: username,
              resetUrl: resetUrl
            }), [user.email])
          })
        }
      ).then(([emailResult]) => {
        console.log(emailResult)
        res.status(200).send({
          success: true,
          email: emailResult.email.substr(0, 2)
        })
      }).catch(err => {
        console.error(err)
        if(err.error === C.ERROR_CODE_ACCOUNT_NOT_EXISTS){
          res.status(200).send({
            success: false,
            email: null,
            error: err.error
          })
        }else res.status(500).send(err)
      })
  }

  issuePasswordResetToken = (req, res) => {
    const userId = req.params.participantId || req.body.userId

    this.issuePasswordResetTokenOfUser({ _id: userId }).then(
      token => {
        res.status(200).send({
          reset_token: token
        })
      }
    ).catch(err => {
      console.error(err)
      res.status(500).send(err)
    })
  }

  resetPasswordWithToken = (req, res) => {
    const token = req.body.token
    console.log("reset password with token: ", token)

    OTUser.findOne({ password_reset_token: token }).then(
      user => {
        if (user) {
          if ((user["reset_token_expires"] as Date).getTime() > Date.now()) {
            this.hashPassword(req.body.password,
              (newPasswordErr, hashedNewPassword) => {
                if (newPasswordErr) {
                  console.error(newPasswordErr)
                  res.status(500).send({
                    error: newPasswordErr
                  })
                } else {
                  user["hashed_password"] = hashedNewPassword
                  user["passwordSetAt"] = new Date()
                  user["reset_token_expires"] = null
                  user["password_reset_token"] = null
                  user.save().then(() => {
                    res.status(200).send(true)
                  })
                }
              })
          } else {
            //token expired.
            user["reset_token_expires"] = null
            user["password_reset_token"] = null
            user.save().then(() => {
              res.status(401).send({
                error: C.ERROR_CODE_TOKEN_EXPIRED
              })
            })
          }
        } else {
          res.status(404).send({
            error: C.ERROR_CODE_ACCOUNT_NOT_EXISTS
          })
        }
      }
    )
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
      res.status(200).send(false)
    }
  }

}
const userCtrl = new OTUserCtrl()
export { userCtrl }
