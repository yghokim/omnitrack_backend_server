import BaseCtrl from './base';
import * as mongoose from 'mongoose';
import OTUser from '../models/ot_user';
import OTItem from '../models/ot_item';
import OTTracker from '../models/ot_tracker';
import OTTrigger from '../models/ot_trigger';
import OTUserReport from '../models/ot_user_report';
import InformationUpdateResult from '../../omnitrack/core/information_update_result';
import app, { firebaseApp } from '../app';
import { SocketConstants } from '../../omnitrack/core/research/socket';
import { experimentCtrl } from './research/ot_experiment_controller';
import { IUserDbEntity, IClientDevice } from '../../omnitrack/core/db-entity-types';
import { deferPromise } from '../../shared_lib/utils';
import OTParticipant from '../models/ot_participant';
import OTExperiment from 'models/ot_experiment';
import * as moment from 'moment';

export default class OTUserCtrl extends BaseCtrl {
  model = OTUser

  _checkExperimentParticipationStatus(uid: string, experimentId: string): Promise<boolean> {
    return OTParticipant.findOne({
      user: uid,
      experiment: experimentId,
      dropped: false
    }, { _id: 1 }).lean().then(participant => {
      return participant != null
    })
  }

  _authenticate(uid: string, deviceInfo: IClientDevice, invitationCode?: string, experimentId?: string, demographic?: any): Promise<{ user: IUserDbEntity, deviceLocalKey: number, inserted: boolean }> {
    return deferPromise(() => {
      if (invitationCode != null && experimentId != null) {
        //check invitation code and experimentId
        return experimentCtrl.matchInvitationWithExperiment(invitationCode, experimentId).then(match => {
          if (match === true) {
            return this.getUserOrInsert(uid)
          } else throw { code: "IllegalInvitationCode" }
        })
      } else {
        return this.getUserOrInsert(uid)
      }
    }).then(result => {
      //handle new user examples=======================
      if (result.inserted === true && experimentId == null) {
        //new user
        return app.omnitrackModule().injectFirstUserExamples(uid).then(() => result)
      }
      //-----------------------------------------------
      else return result
    }).then(result => {
      //handle updating deviceInfo===========================
      const deviceUpdateResult = this.upsertDeviceInfoLocally(result.user, deviceInfo)
      //----------------------------------------
      return (result.user as any as mongoose.Document).save().then(() => ({ user: result.user, deviceLocalKey: deviceUpdateResult.localKey, inserted: result.inserted }))
    }).then(
      result => {
        if(experimentId!=null){
          return this._checkExperimentParticipationStatus(uid, experimentId).then(
            isInParticipation => {
              if(isInParticipation){
                return result
              }else return app.researchModule().assignParticipantToExperiment(uid, invitationCode, experimentId, demographic).then(assignExperimentResult => {
                return result
              })
            })
        }else return result
      }
    )
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
      console.log("found device with id matches: ")
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

  private fetchUserDataToDb(uid: string): Promise<IUserDbEntity> {
    const generate = require("adjective-adjective-animal");

    return generate({ adjectives: 2, format: "title" }).then(
      generatedName => {
        return firebaseApp.auth().getUser(uid)
          .then(
            userRecord => {
              console.log("fetched Firebase auth user account:")
              console.log(userRecord)
              return OTUser.findOneAndUpdate({ _id: uid }, {
                $set: {
                  name: generatedName,
                  email: userRecord.email,
                  picture: userRecord.photoURL,
                  accountCreationTime: userRecord.metadata.creationTime,
                  accountLastSignInTime: userRecord.metadata.lastSignInTime,
                  nameUpdatedAt: Date.now()
                }
              }, { upsert: true, new: true }).then(
                result => {
                  return result
                }
              )
            }
          )
      })
  }

  private getUserOrInsert(userId: string): Promise<{ user: IUserDbEntity, inserted: boolean }> {
    return OTUser.findOne({ _id: userId }).then(
      result => {
        if (result == null) {
          return this.fetchUserDataToDb(userId)
            .then(user => ({ user: user, inserted: true }))
            .catch(ex => {
              console.log(ex)
              return Promise.reject(ex)
            })
        } else { return Promise.resolve({ user: result as any, inserted: false }) }
      }
    )
  }

  getRoles = (req, res) => {
    const userId = res.locals.user.uid
    OTUser.findById(userId).then(
      result => {
        if (result == null) {
          res.json([])
        } else { res.json(result["activatedRoles"] || []) }
      }
    ).catch(
      error => {
        console.log(error)
        res.status(500).send(error)
      }
    )
  }


  postRole = (req, res) => {
    const userId = res.locals.user.uid
    this.getUserOrInsert(userId).then(
      userResult => {
        const user = userResult.user
        const newRole = req.body
        if (newRole != null) {
          let updated = false
          user.activatedRoles.forEach(role => {
            if (role.role === newRole.role) {
              role.isConsentApproved = newRole.isConsentApproved
              role.information = newRole.information
              updated = true
            }
          })
          if (updated === false) {
            user.activatedRoles.push(newRole)
          }
          (user as any as mongoose.Document).save().then(
            result => {
              if (updated === false || userResult.inserted === true) {
              } else { res.status(200).send(true) }
            }
          ).catch(err => {
            console.log(err)
            res.status(500).send({ error: err })
          })
        } else {
          res.status(500).send("No role was passed.")
        }
      }
    )
  }

  postReport = (req, res) => {
    const reportData = req.body
    const newReport = new OTUserReport({ _id: mongoose.Types.ObjectId(), data: reportData })
    if (reportData.anonymous === true) {
      console.log("received the anonymized report")
    } else {
      console.log("received the de-anonymized report")
      newReport["user"] = res.locals.user.uid
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
    const userId = res.locals.user.uid
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
    const userId = res.locals.user.uid
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
    const userId = res.locals.user.uid
    const deviceInfo = req.body
    console.log('deviceInfo: ')
    console.log(deviceInfo)
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

  putDeviceInfoDeprecated = (req, res) => {
    const userId = res.locals.user.uid
    const deviceInfo = req.body
    console.log('deviceInfo: ')
    console.log(deviceInfo)
    this.getUserOrInsert(userId).then(
      userResult => {
        const deviceInsertionResult = this.upsertDeviceInfoLocally(userResult.user, deviceInfo);

        (userResult.user as any).save(err => {
          console.log(err)
          if (err == null) {
            res.json({
              result: deviceInsertionResult.inserted === true ? "updated" : "added",
              deviceLocalKey: deviceInsertionResult.localKey.toString(16),
              payloads: {
                email: userResult.user.email,
                name: userResult.user.name,
                nameUpdatedAt: userResult.user.nameUpdatedAt.getTime(),
                picture: userResult.user.picture,
                updatedAt: userResult.user.updatedAt.getTime()
              }
            })
          } else { res.status(500).send({ error: "deviceinfo db update failed." }) }
        }, { upsert: true })
      }
    )
  }

  deleteAccount = (req, res) => {
    let userId
    if (req.researcher) {
      // researcher mode
      userId = req.params.userId
    } else if (res.locals.user) {
      userId = res.locals.user.uid
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

  authenticate = (req, res) => {
    const googleUserId = res.locals.user.uid
    const experimentId = res.locals.experimentId || req["OTExperiment"] || req.body.experimentId
    const invitationCode = req.body.invitationCode
    const deviceInfo = req.body.deviceInfo
    const demographic = req.body.demographic
    this._authenticate(googleUserId, deviceInfo, invitationCode, experimentId, demographic).then(
      result => {
        const userInfo = (result.user as any).toJSON()
        userInfo.nameUpdatedAt = moment(userInfo.nameUpdatedAt).unix()
        res.status(200).send(
          {
            inserted: result.inserted,
            deviceLocalKey: result.deviceLocalKey,
            userInfo: userInfo
          }
        )
      }
    ).catch(ex => {
      console.error(ex)
      res.status(500).send(ex)
    })
  }

  getParticipationStatus = (req, res) => {
    const googleUserId = res.locals.user.uid
    const experimentId = req.params.experimentId
    this._checkExperimentParticipationStatus(googleUserId, experimentId).then(
      isInParticipation => {
        res.status(200).send(isInParticipation)
      }
    ).catch(err => {
      console.error(err)
      res.status(500).send(err)
    })
  }

  verifyInvitationCode = (req, res) => {
    const experimentId = req.params.experimentId
    const invitationCode = req.query.invitationCode
    experimentCtrl.matchInvitationWithExperiment(invitationCode, experimentId).then(
      verified => {
        res.status(200).send(verified)
      }
    ).catch(err=>{
      console.error(err)
      res.status(500).send(err)
    })
  }
}
