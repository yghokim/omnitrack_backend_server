import BaseCtrl from './base';
import * as mongoose from 'mongoose';
import OTUser from '../models/ot_user';
import OTUserReport from '../models/ot_user_report';
import * as firebaseAdmin from 'firebase-admin';

export default class OTUserCtrl extends BaseCtrl {
  model = OTUser

  private fetchUserDataToDb(uid: string): Promise<any> {
    console.log("Firebase app:")
    console.log(firebaseAdmin.auth().app.name)

    var generate = require("adjective-adjective-animal");

    return generate({ adjectives: 2, format: "Title" }).then(
      generatedName => {
        return firebaseAdmin.auth().getUser(uid)
          .then(
          userRecord => {
            console.log("fetched Firebase auth user account:")
            console.log(userRecord)
            return OTUser.update({ _id: uid }, {
              $set: {
                name: generatedName,
                email: userRecord.email,
                picture: userRecord.photoURL,
                accountCreationTime: userRecord.metadata.creationTime,
                accountLastSignInTime: userRecord.metadata.lastSignInTime,
              }
            }, { upsert: true }).then(
              result => {
                return OTUser.findOne({ _id: uid })
              }
              )
          }
          )
      })
  }

  private getUserOrInsert(userId: string): Promise<{ user: any, inserted: boolean }> {
    return OTUser.findOne({ _id: userId }).then(
      result => {
        if (result == null) {
          return this.fetchUserDataToDb(userId).then(user => { return { user: user, inserted: true } })
        }
        else return Promise.resolve({ user: result, inserted: false })
      }
    )
  }

  getRoles = (req, res) => {
    const userId = res.locals.user.uid
    OTUser.findOne({ _id: userId }).then(
      result => {
        if (result == null) {
          res.json([])
        }
        else res.json(result["activatedRoles"] || [])
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
          var updated = false
          user.activatedRoles.forEach(role => {
            if (role.role == newRole.role) {
              role.isConsentApproved = newRole.isConsentApproved
              role.information = newRole.information
              updated = true
            }
          })
          if (updated == false) {
            user.activatedRoles.push(newRole)
          }
          user.save().then(
            result => {
              if (updated == false || userResult.inserted == true) {
                console.log("insert new log")
                //new user role
                req.app["omnitrack"].fireUserPolicyModule.processOnNewUserRole(userId, newRole.role)
                  .then(
                  () => {
                    res.status(200).send(true)
                  }
                  )
              }
              else res.status(200).send(true)
            }
          ).catch(err => {
            res.status(500).send({ error: err })
          })
        }
        else {
          res.status(500).send("No role was passed.")
        }
      }
    )
  }

  postReport = (req, res) => {
    const reportData = req.body
    const newReport = new OTUserReport({ _id: mongoose.Types.ObjectId(), data: reportData })
    if (reportData.anonymous == true) {
      console.log("received the anonymized report")
    }
    else {
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

  getDevices = (req, res) => {
    const userId = res.locals.user.uid
    OTUser.findOne({ _id: userId }).then(
      result => {
        if (result == null) {
          res.json([])
        }
        else res.json(result["devices"] || [])
      }
    ).catch(
      error => {
        console.log(error)
        res.status(500).send(error)
      }
      )
  }

  putDeviceInfo = (req, res) => {
    const userId = res.locals.user.uid
    const deviceInfo = req.body
    this.getUserOrInsert(userId).then(
      userResult => {
        const user = userResult.user
        console.log("insertedUser: ")
        console.log(user)
        var updated = false
        var localKey = null
        const matchedDevice = user.devices.find(device => device.deviceId == deviceInfo.deviceId)
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
        }
        else {
          localKey = (user.deviceLocalKeySeed || 0) + 1
          deviceInfo.localKey = localKey
          user.deviceLocalKeySeed++
          user.devices.push(deviceInfo)

          updated = false
        }
        console.log("localKey: " + localKey)

        user.save(err => {
          console.log(err)
          if (err == null) {
            console.log("device local key: " + localKey)
            res.json({ 
              result: updated == true ? "updated" : "added", 
              deviceLocalKey: localKey.toString(16),
              payloads: {email: user.email, name: user.name, picture: user.picture}
          })
          }
          else res.status(500).send({ error: "deviceinfo db update failed." })
        }, { upsert: true })
      }
    )
  }
}
