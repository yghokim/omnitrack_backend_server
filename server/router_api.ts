import { firebaseApp } from './app';
import OTSyncCtrl from './controllers/ot_sync_controller';
import OTTrackerCtrl from './controllers/ot_tracker_controller';
import OTTriggerCtrl from './controllers/ot_trigger_controller';
import OTUserCtrl from './controllers/ot_user_controller';
import { itemCtrl } from './controllers/ot_item_controller';
import otUsageLogCtrl from './controllers/ot_usage_log_controller';
import OTResearchCtrl from './controllers/ot_research_controller';
import OTUser from './models/ot_user';
import AdminCtrl from './controllers/admin_controller';
import BinaryStorageCtrl from './controllers/binary_storage_controller';
import { experimentCtrl } from './controllers/research/ot_experiment_controller';
import { clientBinaryCtrl } from './controllers/research/ot_client_binary_controller';
import { clientSignatureCtrl } from './controllers/ot_client_signature_controller';
import { trackingPackageCtrl } from './controllers/ot_tracking_package_controller';
import { Request } from 'express';
import { Error } from 'mongoose';
import UserBelongingCtrl from './controllers/user_belongings_base';
import { RouterWrapper } from './server_utils';
import { userDataStoreCtrl } from './controllers/ot_user_datastore_controller';

export class ClientApiRouter extends RouterWrapper {
  constructor() {
    super()

    const trackerCtrl = new OTTrackerCtrl();
    const triggerCtrl = new OTTriggerCtrl();
    const userCtrl = new OTUserCtrl();
    const syncCtrl = new OTSyncCtrl(trackerCtrl, triggerCtrl, itemCtrl)
    const storageCtrl = new BinaryStorageCtrl()
    const adminCtrl = new AdminCtrl()
    const researchCtrl = new OTResearchCtrl()

    // revised https://github.com/antonybudianto/express-firebase-middleware/blob/master/src/auth.middleware.js
    const firebaseMiddleware = function firebaseAuthMiddleware(req, res, next) {
      const authorization = req.header('Authorization');
      if (authorization) {
        const token = authorization.split(' ');
        firebaseApp.auth().verifyIdToken(token[1])
          .then((decodedToken) => {
            res.locals.user = decodedToken;
            next();
          })
          .catch(err => {
            console.log(err);
            res.sendStatus(401);
          });
      } else {
        console.log('Authorization header is not found');
        res.sendStatus(401);
      }
    }

    const omnitrackDeviceCheckMiddleware = (req: Request, res, next) => {
      const deviceId = req.get("OTDeviceId")
      const fingerPrint = req.get("OTFingerPrint")
      const packageName = req.get("OTPackageName")
      const role = req.get("OTRole")
      console.log("role:" + role + ", device id : " + deviceId + ", fingerPrint: " + fingerPrint + ", packageName: " + packageName)

      res.locals["roleName"] = role

      clientSignatureCtrl.matchSignature(fingerPrint, packageName).then(
        match => {
          if (match !== true) {
            console.log("The client is not certificated in the server.")
            res.status(404).send(new Error("The client is not certificated in the server."))
          } else if (deviceId != null) {
            if (res.locals.user) {
              OTUser.collection.findOne({ _id: res.locals.user.uid, "devices.deviceId": deviceId }).then(
                user => {
                  if (user != null) {
                    console.log("received an authorized call from device: " + deviceId)
                    res.locals["deviceId"] = deviceId
                    next()
                  } else {
                    res.status(404).send(new Error("no such device."))
                  }
                }).catch((err) => {
                  console.log(err)
                  res.status(500).send(err)
                })
            } else {
              next()
            }
          } else { next() }
        }
      )
    }

    const assertSignedInMiddleware = [firebaseMiddleware, omnitrackDeviceCheckMiddleware]


    // admin
    this.router.route('/admin/package/extract').get(trackingPackageCtrl.getExtractedTrackingPackageJson)
    this.router.route('/admin/package/inject/:userId/:packageName?').get(adminCtrl.injectPackageToUser)

    this.router.route('/admin/trigger/attach_tracker/:triggerId').get(adminCtrl.attachTrackerToTrigger)
    this.router.route('/admin/trigger/set_switch/:triggerId/:isOn').get(adminCtrl.setTriggerSwitch)
    this.router.route('/admin/tracker/remove/:trackerId').get(adminCtrl.removeTracker)
    this.router.route('/admin/user/remove/:userId').get(adminCtrl.removeUser)

    this.router.route("/admin/user/migrate").get(adminCtrl.migrateUserTrackingData)

    this.router.route("/admin/tracker/attribute/property/get/:trackerId/:attributeLocalId/:propertyKey").get(adminCtrl.getAttributePropertyValue)

    this.router.route("/admin/tracker/attribute/property/set/:propertyKey").get(adminCtrl.setAttributePropertySerializedValue)

    this.router.post('/usage_logs/batch/insert', omnitrackDeviceCheckMiddleware, otUsageLogCtrl.insertMany)

    // batch
    this.router.get('/batch/changes', assertSignedInMiddleware, syncCtrl.batchGetServerChangesAfter)
    this.router.post('/batch/changes', assertSignedInMiddleware, syncCtrl.batchPostClientChanges)

    this.router.get('/items/changes', assertSignedInMiddleware, itemCtrl.getServerChanges)
    this.router.post('/items/changes', assertSignedInMiddleware, itemCtrl.postClientChanges)

    this.router.route('/user/data_store/:storeKey')
      .get(assertSignedInMiddleware, (req, res) => {
        userDataStoreCtrl.getDataStoreValue(res.locals.user.uid, req.params.storeKey).then(
          entry => {
            res.status(200).send(entry)
          }
        ).catch(err => {
          console.log(err);
          res.status(500).send(err)
        })
      })
      .post(assertSignedInMiddleware, (req, res) => {
        userDataStoreCtrl.setDataStoreValue(res.locals.user.uid, req.params.storeKey, req.body.value, req.body.updatedAt, req.body.force).then(result => {
          res.status(200).send(result)
        }).catch(err => {
          console.log(err);
          res.status(500).send(err)
        })
      })

    this.router.route('/user/data_store/changes')
      .get(assertSignedInMiddleware, (req, res) => {
        userDataStoreCtrl.getDataStoreChangedAfter(res.locals.user.uid, req.body.timestamp).then(
          result => {
            res.status(200).send(result || [])
          }
        ).catch(err => {
          console.log(err)
          res.status(500).send(err)
        })
      })
      .post(assertSignedInMiddleware, (req, res) => {
        userDataStoreCtrl.setDataStore(res.locals.user.uid, req.body.list).then(
          result => {
            res.status(200).send(result)
          }
        ).catch(err => {
          res.status(500).send(err)
        })
      })

    this.router.get('/user/roles', firebaseMiddleware, userCtrl.getRoles)
    this.router.post('/user/role', assertSignedInMiddleware, userCtrl.postRole)
    this.router.post('/user/name', assertSignedInMiddleware, userCtrl.putUserName)
    this.router.post('/user/device', firebaseMiddleware, userCtrl.putDeviceInfo)
    this.router.post('/user/report', assertSignedInMiddleware, userCtrl.postReport)
    this.router.delete('/user', assertSignedInMiddleware, userCtrl.deleteAccount)
    this.router.post('/user/delete', assertSignedInMiddleware, userCtrl.deleteAccount)


    // REST API
    const restCtrlDict: Map<string, UserBelongingCtrl> = new Map([
      ["trackers", trackerCtrl],
      ["items", itemCtrl],
      ["triggers", triggerCtrl]
    ])

    restCtrlDict.forEach((ctrl, key) => {
      this.router.route('/' + key + "/:id")
        .get(firebaseMiddleware, ctrl.get)
        .put(firebaseMiddleware, ctrl.update)
      this.router.route('/' + key).get(firebaseMiddleware, ctrl.getAllOfUser).post(firebaseMiddleware, ctrl.insert)
    })

    // Items
    this.router.route("/trackers/:trackerId/items").get(firebaseMiddleware, itemCtrl.getAllOfTracker)

    // data manipulation
    this.router.post("/item/update_column", firebaseMiddleware, itemCtrl.postItemValue)
    this.router.post("/item/update_timestamp", firebaseMiddleware, itemCtrl.postItemTimestamp)

    this.router.route('/debug/items/all').get(itemCtrl.getAll)
    this.router.route('/debug/users/all').get(userCtrl.getAll)
    this.router.route('/debug/trackers/all').get(trackerCtrl.getAll)
    this.router.route('/debug/triggers/all').get(triggerCtrl.getAll)

    /*
    this.router.route('/users/destroy').get(userCtrl.destroy)
    this.router.route('/trackers/destroy').get(trackerCtrl.destroy)
    this.router.route('/items/destroy').get(itemCtrl.destroy)
    this.router.route('/triggers/destroy').get(triggerCtrl.destroy)*/

    this.router.route('/media/all').get(storageCtrl.getAll)

    // binary
    this.router.post('/upload/item_media/:trackerId/:itemId/:attrLocalId/:fileIdentifier', assertSignedInMiddleware, storageCtrl.uploadItemMedia)
    this.router.get('/files/item_media/:trackerId/:itemId/:attrLocalId/:fileIdentifier/:processingType?', assertSignedInMiddleware, storageCtrl.downloadItemMedia)

    this.router.post("/research/invitation/approve", assertSignedInMiddleware, researchCtrl.approveExperimentInvitation)

    //this.router.post("/research/invitation/reject", assertSignedInMiddleware, researchCtrl.rejectExperimentInvitation)

    this.router.post("/research/experiment/:experimentId/dropout", assertSignedInMiddleware, researchCtrl.dropOutFromExperiment)

    this.router.get('/research/experiments/history', firebaseMiddleware, researchCtrl.getExperimentHistoryOfUser)

    this.router.get('/research/invitations/public', assertSignedInMiddleware, experimentCtrl.getPublicInvitationList)

    this.router.get('/clients/all', clientBinaryCtrl.getClientBinaries)

    this.router.get('/clients/download', clientBinaryCtrl.downloadClientBinary)

    this.router.get('/clients/latest', clientBinaryCtrl.getLatestVersionInfo)

    // package
    this.router.get('/package/extract', assertSignedInMiddleware, trackingPackageCtrl.getExtractedTrackingPackageJson)

    this.router.post('/package/temporary', assertSignedInMiddleware,
    trackingPackageCtrl.postTrackingPackageToGlobalList)
  }
}