import OTSyncCtrl from './controllers/ot_sync_controller';
import OTTrackerCtrl from './controllers/ot_tracker_controller';
import OTTriggerCtrl from './controllers/ot_trigger_controller';
import { userCtrl } from './controllers/ot_user_controller';
import { itemCtrl } from './controllers/ot_item_controller';
import otUsageLogCtrl from './controllers/ot_usage_log_controller';
import OTUser from './models/ot_user';
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
import C from './server_consts';

export class ClientApiRouter extends RouterWrapper {
  constructor() {
    super()

    const trackerCtrl = new OTTrackerCtrl();
    const triggerCtrl = new OTTriggerCtrl();
    const syncCtrl = new OTSyncCtrl(trackerCtrl, triggerCtrl, itemCtrl)
    const storageCtrl = new BinaryStorageCtrl()

    const certifiedDeviceCheckMiddleware = (req: Request, res, next) => {
      const fingerPrint = req.get("OTFingerPrint")
      const packageName = req.get("OTPackageName")
      const experimentId = req.get('OTExperiment')
      console.log("check client certification===============================")
      console.log("fingerPrint): " + fingerPrint)
      console.log("package: " + packageName)
      console.log("experiment id: " + experimentId)
      console.log("=========================================================")
      clientSignatureCtrl.matchSignature(fingerPrint, packageName, experimentId).then(
        match => {
          if (match === true) {
            next()
          } else {
            console.log("The client is not certificated in the server.")
            res.status(401).send({
              error: C.ERROR_CODE_UNCERTIFIED_Client
            })
          }
        }
      )
    }

    const userDeviceCheckMiddleware = (req, res, next) => {
      const deviceId = req.get("OTDeviceId")
      const fingerPrint = req.get("OTFingerPrint")
      const packageName = req.get("OTPackageName")
      const experimentId = req.get('OTExperiment')

      OTUser.findOne({ _id: req.user.uid, "devices.deviceId": deviceId }).lean<any>().then(
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

    const appSignedInMiddleware = [certifiedDeviceCheckMiddleware, userSignedInMiddleware, userDeviceCheckMiddleware]

    //client certification check
    this.router.route('/user/validate_client').get(certifiedDeviceCheckMiddleware, (req, res) => {
      res.status(200).send(true)
    })

    // admin
    this.router.route('/admin/package/extract').get(trackingPackageCtrl.getExtractedTrackingPackageJson)

    this.router.post('/usage_logs/batch/insert', certifiedDeviceCheckMiddleware, otUsageLogCtrl.insertMany)

    // batch
    this.router.get('/batch/changes', appSignedInMiddleware, syncCtrl.batchGetServerChangesAfter)
    this.router.post('/batch/changes', appSignedInMiddleware, syncCtrl.batchPostClientChanges)

    this.router.get('/items/changes', appSignedInMiddleware, itemCtrl.getServerChanges)
    this.router.post('/items/changes', appSignedInMiddleware, itemCtrl.postClientChanges)


    // auth
    this.router.post("/user/auth/register", userCtrl.register)
    this.router.post("/user/auth/authenticate", userCtrl.authenticate)
    this.router.post("/user/auth/refresh_token", appSignedInMiddleware, userCtrl.refreshToken)
    this.router.post("/user/auth/signout", appSignedInMiddleware, userCtrl.signOut)

    this.router.get("/user/auth/app_flag", appSignedInMiddleware, userCtrl.getAppFlags)

    this.router.post('/user/auth/request_password_link', userCtrl.requestPasswordResetLinkToEmail)

    this.router.route('/user/data_store/:storeKey')
      .get(appSignedInMiddleware, (req, res) => {
        userDataStoreCtrl.getDataStoreValue(req.user.uid, req.params.storeKey).then(
          entry => {
            res.status(200).send(entry)
          }
        ).catch(err => {
          console.log(err);
          res.status(500).send(err)
        })
      })
      .post(appSignedInMiddleware, (req, res) => {
        userDataStoreCtrl.setDataStoreValue(req.user.uid, req.params.storeKey, req.body.value, req.body.updatedAt, req.body.force).then(result => {
          res.status(200).send(result)
        }).catch(err => {
          console.log(err);
          res.status(500).send(err)
        })
      })

    this.router.route('/user/data_store/changes')
      .get(appSignedInMiddleware, (req, res) => {
        userDataStoreCtrl.getDataStoreChangedAfter(req.user.uid, req.body.timestamp).then(
          result => {
            res.status(200).send(result || [])
          }
        ).catch(err => {
          console.log(err)
          res.status(500).send(err)
        })
      })
      .post(appSignedInMiddleware, (req, res) => {
        userDataStoreCtrl.setDataStore(req.user.uid, req.body.list).then(
          result => {
            res.status(200).send(result)
          }
        ).catch(err => {
          res.status(500).send(err)
        })
      })

    this.router.post('/user/auth/device', appSignedInMiddleware, userCtrl.upsertDeviceInfo)

    this.router.post('/user/auth/update', appSignedInMiddleware, userCtrl.update)

    this.router.post("/user/auth/drop", appSignedInMiddleware, experimentCtrl.dropOutFromExperiment)

    this.router.post('/user/name', appSignedInMiddleware, userCtrl.putUserName)
    this.router.post('/user/report', appSignedInMiddleware, userCtrl.postReport)
    this.router.delete('/user', appSignedInMiddleware, userCtrl.deleteAccount)
    this.router.post('/user/delete', appSignedInMiddleware, userCtrl.deleteAccount)


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
    this.router.post('/upload/item_media/:trackerId/:itemId/:fieldLocalId/:fileIdentifier', appSignedInMiddleware, storageCtrl.uploadItemMedia)
    this.router.get('/files/item_media/:trackerId/:itemId/:fieldLocalId/:fileIdentifier/:processingType?', appSignedInMiddleware, storageCtrl.downloadItemMedia)

    // this.router.post("/research/invitation/reject", assertSignedInMiddleware, researchCtrl.rejectExperimentInvitation)

    this.router.get('/research/experiment/:experimentId/verify_invitation', certifiedDeviceCheckMiddleware, userCtrl.verifyInvitationCode)

    this.router.get('/research/experiment/:experimentId/consent', certifiedDeviceCheckMiddleware, experimentCtrl.getExperimentConsentInfo)

    this.router.get('/research/invitations/public', appSignedInMiddleware, experimentCtrl.getPublicInvitationList)

    this.router.get('/clients/all', clientBinaryCtrl.getClientBinaries)

    this.router.get('/clients/download', clientBinaryCtrl.downloadClientBinary)

    this.router.get('/clients/latest', clientBinaryCtrl.getLatestVersionInfo)

    // package
    this.router.get('/package/extract', appSignedInMiddleware, trackingPackageCtrl.getExtractedTrackingPackageJson)

    this.router.post('/package/temporary', appSignedInMiddleware,
      trackingPackageCtrl.postTrackingPackageToGlobalList)

    //password reset
    this.router.post('/user/auth/reset_password', userCtrl.resetPasswordWithToken)
  }
}
