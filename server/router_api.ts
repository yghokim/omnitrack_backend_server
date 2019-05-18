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

    const certifiedDeviceCheckMiddleware = (req: Request, res, next) => {
      const fingerPrint = req.get("OTFingerPrint")
      const packageName = req.get("OTPackageName")
      const experimentId = req.get('OTExperiment')
      clientSignatureCtrl.matchSignature(fingerPrint, packageName, experimentId).then(
        match => {
          if (match === true) {
            next()
          }else{
            console.log("The client is not certificated in the server.")
            res.status(401).send(new Error("The client is not certificated in the server."))
          }
        }
      )
    }

    const userDeviceCheckMiddleware = (req, res, next) => {
      const deviceId = req.get("OTDeviceId")
      const fingerPrint = req.get("OTFingerPrint")
      const packageName = req.get("OTPackageName")
      const experimentId = req.get('OTExperiment')

      OTUser.findOne({ _id: req.user.uid, "devices.deviceId": deviceId }).lean().then(
        user => {
          if (user != null) {
            console.log("received an authorized call from device: " + deviceId)
            next()
          } else {
            res.status(401).send(new Error("no such device."))
          }
        }).catch(err => {
          console.log(err)
          res.status(500).send(err)
        })
    }

    const userSignedInMiddleware = userCtrl.makeTokenAuthMiddleware()

    const assertSignedInMiddleware = [certifiedDeviceCheckMiddleware, userSignedInMiddleware, userDeviceCheckMiddleware]

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

    this.router.post('/usage_logs/batch/insert', certifiedDeviceCheckMiddleware, otUsageLogCtrl.insertMany)

    // batch
    this.router.get('/batch/changes', assertSignedInMiddleware, syncCtrl.batchGetServerChangesAfter)
    this.router.post('/batch/changes', assertSignedInMiddleware, syncCtrl.batchPostClientChanges)

    this.router.get('/items/changes', assertSignedInMiddleware, itemCtrl.getServerChanges)
    this.router.post('/items/changes', assertSignedInMiddleware, itemCtrl.postClientChanges)


    // auth
    this.router.post("/user/auth/register", userCtrl.register)
    this.router.post("/user/auth/authenticate", userCtrl.authenticate)
    this.router.post("/user/auth/refresh_token", assertSignedInMiddleware, userCtrl.refreshToken)
    
    this.router.route('/user/data_store/:storeKey')
      .get(assertSignedInMiddleware, (req, res) => {
        userDataStoreCtrl.getDataStoreValue(req.user.uid, req.params.storeKey).then(
          entry => {
            res.status(200).send(entry)
          }
        ).catch(err => {
          console.log(err);
          res.status(500).send(err)
        })
      })
      .post(assertSignedInMiddleware, (req, res) => {
        userDataStoreCtrl.setDataStoreValue(req.user.uid, req.params.storeKey, req.body.value, req.body.updatedAt, req.body.force).then(result => {
          res.status(200).send(result)
        }).catch(err => {
          console.log(err);
          res.status(500).send(err)
        })
      })

    this.router.route('/user/data_store/changes')
      .get(assertSignedInMiddleware, (req, res) => {
        userDataStoreCtrl.getDataStoreChangedAfter(req.user.uid, req.body.timestamp).then(
          result => {
            res.status(200).send(result || [])
          }
        ).catch(err => {
          console.log(err)
          res.status(500).send(err)
        })
      })
      .post(assertSignedInMiddleware, (req, res) => {
        userDataStoreCtrl.setDataStore(req.user.uid, req.body.list).then(
          result => {
            res.status(200).send(result)
          }
        ).catch(err => {
          res.status(500).send(err)
        })
      })

    this.router.post('/user/auth/device', assertSignedInMiddleware, userCtrl.upsertDeviceInfo)

    this.router.post('/user/name', assertSignedInMiddleware, userCtrl.putUserName)
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
        .get(userSignedInMiddleware, ctrl.get)
        .put(userSignedInMiddleware, ctrl.update)
      this.router.route('/' + key).get(userSignedInMiddleware, ctrl.getAllOfUser).post(userSignedInMiddleware, ctrl.insert)
    })

    // Items
    this.router.route("/trackers/:trackerId/items").get(userSignedInMiddleware, itemCtrl.getAllOfTracker)

    // data manipulation
    this.router.post("/item/update_column", userSignedInMiddleware, itemCtrl.postItemValue)
    this.router.post("/item/update_timestamp", userSignedInMiddleware, itemCtrl.postItemTimestamp)

    this.router.route('/media/all').get(storageCtrl.getAll)

    // binary
    this.router.post('/upload/item_media/:trackerId/:itemId/:attrLocalId/:fileIdentifier', assertSignedInMiddleware, storageCtrl.uploadItemMedia)
    this.router.get('/files/item_media/:trackerId/:itemId/:attrLocalId/:fileIdentifier/:processingType?', assertSignedInMiddleware, storageCtrl.downloadItemMedia)

    // this.router.post("/research/invitation/reject", assertSignedInMiddleware, researchCtrl.rejectExperimentInvitation)

    this.router.get('/research/experiment/:experimentId/verify_invitation', certifiedDeviceCheckMiddleware, userCtrl.verifyInvitationCode)

    this.router.get('/research/experiment/:experimentId/consent', certifiedDeviceCheckMiddleware, researchCtrl.getExperimentConsentInfo)

    this.router.post("/research/experiment/:experimentId/dropout", assertSignedInMiddleware, researchCtrl.dropOutFromExperiment)

    this.router.get('/research/experiments/history', certifiedDeviceCheckMiddleware, researchCtrl.getExperimentHistoryOfUser)

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