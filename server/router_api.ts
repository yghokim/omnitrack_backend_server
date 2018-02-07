import * as express from 'express';

import OTSyncCtrl from './controllers/ot_sync_controller';
import OTItemCtrl from './controllers/ot_item_controller';
import OTTrackerCtrl from './controllers/ot_tracker_controller';
import OTTriggerCtrl from './controllers/ot_trigger_controller';
import OTUserCtrl from './controllers/ot_user_controller';
import OTUsageLogCtrl from './controllers/ot_usage_log_controller';
import OTResearchCtrl from './controllers/ot_research_controller';
import UserCtrl from './controllers/user';
import OTUser from './models/ot_user';
import User from './models/user';
import AdminCtrl from './controllers/admin_controller';
import BinaryStorageCtrl from './controllers/binary_storage_controller';
import { experimentCtrl } from './controllers/research/ot_experiment_controller';
import { clientBinaryCtrl } from './controllers/research/ot_client_binary_controller';
import { Request } from 'express';
import { Error } from 'mongoose';
import { clientKeys } from "./app";

const router = express.Router();

  const itemCtrl = new OTItemCtrl();
  const trackerCtrl = new OTTrackerCtrl();
  const triggerCtrl = new OTTriggerCtrl();
  const userCtrl = new OTUserCtrl();
  const usageLogCtrl = new OTUsageLogCtrl();
  const syncCtrl = new OTSyncCtrl(trackerCtrl, triggerCtrl, itemCtrl)
  const storageCtrl = new BinaryStorageCtrl()
  const adminCtrl = new AdminCtrl()
  const researchCtrl = new OTResearchCtrl()

  const firebaseMiddleware = require('express-firebase-middleware');

  const omnitrackDeviceCheckMiddleware = (req: Request, res, next) => {
    const deviceId = req.get("OTDeviceId")
    const fingerPrint = req.get("OTFingerPrint")
    const packageName = req.get("OTPackageName")
    const role = req.get("OTRole")
    console.log("role:" + role + ", device id : " + deviceId + ", fingerPrint: " + fingerPrint + ", packageName: " + packageName)

    res.locals["roleName"] = role

    if (clientKeys.find(k => k.key === fingerPrint && k.package === packageName) == null) {
      console.log(clientKeys)
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

  const assertSignedInMiddleware = [firebaseMiddleware.auth, omnitrackDeviceCheckMiddleware]

  // admin
  router.route('/admin/package/extract').get(adminCtrl.extractPredefinedPackage)
  router.route('/admin/package/inject/:userId/:packageName?').get(adminCtrl.injectPackageToUser)

  router.route('/admin/trigger/attach_tracker/:triggerId').get(adminCtrl.attachTrackerToTrigger)
  router.route('/admin/trigger/set_switch/:triggerId/:isOn').get(adminCtrl.setTriggerSwitch)
  router.route('/admin/tracker/remove/:trackerId').get(adminCtrl.removeTracker)
  router.route('/admin/user/remove/:userId').get(adminCtrl.removeUser)

  router.route("/admin/user/migrate").get(adminCtrl.migrateUserTrackingData)

  router.route("/admin/tracker/attribute/property/get/:trackerId/:attributeLocalId/:propertyKey").get(adminCtrl.getAttributePropertyValue)

  router.route("/admin/tracker/attribute/property/set/:propertyKey").get(adminCtrl.setAttributePropertySerializedValue)

  router.post('/usage_logs/batch/insert', omnitrackDeviceCheckMiddleware, usageLogCtrl.insertMany)

  // batch
  router.get('/batch/changes', assertSignedInMiddleware, syncCtrl.batchGetServerChangesAfter)
  router.post('/batch/changes', assertSignedInMiddleware, syncCtrl.batchPostClientChanges)

  router.get('/items/changes', assertSignedInMiddleware, itemCtrl.getServerChanges)
  router.post('/items/changes', assertSignedInMiddleware, itemCtrl.postClientChanges)

  router.get('/user/roles', firebaseMiddleware.auth, userCtrl.getRoles)
  router.post('/user/role', assertSignedInMiddleware, userCtrl.postRole)
  router.put('/user/name', assertSignedInMiddleware, userCtrl.putUserName)
  router.put('/user/device', firebaseMiddleware.auth, userCtrl.putDeviceInfo)
  router.post('/user/report', assertSignedInMiddleware, userCtrl.postReport)
  router.delete('/user', assertSignedInMiddleware, userCtrl.deleteAccount)

  router.route('/items/all').get(itemCtrl.getAll)
  router.route('/users/all').get(userCtrl.getAll)
  router.route('/trackers/all').get(trackerCtrl.getAll)
  router.route('/triggers/all').get(triggerCtrl.getAll)

  router.route('/usage/logs/').get(usageLogCtrl.getAll)

  router.route('/users/destroy').get(userCtrl.destroy)
  router.route('/trackers/destroy').get(trackerCtrl.destroy)
  router.route('/items/destroy').get(itemCtrl.destroy)
  router.route('/triggers/destroy').get(triggerCtrl.destroy)

  // binary
  router.post('/upload/item_media/:trackerId/:itemId/:attrLocalId/:fileIdentifier', assertSignedInMiddleware, storageCtrl.uploadItemMedia)
  router.get('/files/item_media/:trackerId/:itemId/:attrLocalId/:fileIdentifier/:processingType?', assertSignedInMiddleware, storageCtrl.downloadItemMedia)

  router.post("/research/invitation/approve", assertSignedInMiddleware, researchCtrl.approveExperimentInvitation)

  router.post("/research/invitation/reject", assertSignedInMiddleware, researchCtrl.rejectExperimentInvitation)

  router.post("/research/experiment/:experimentId/dropout", assertSignedInMiddleware, researchCtrl.dropOutFromExperiment)

  router.get('/research/experiments/history', assertSignedInMiddleware, researchCtrl.getExperimentHistoryOfUser)

  router.get('/research/invitations/public', assertSignedInMiddleware, experimentCtrl.getPublicInvitationList)

  router.get('/clients/all', clientBinaryCtrl.getClientBinaries)

  router.get('/clients/download', clientBinaryCtrl.downloadClientBinary)

  /*
    router.route('/items/count').get(catCtrl.count);
    router.route('/cat').post(catCtrl.insert);
    router.route('/cat/:id').get(catCtrl.get);
    router.route('/cat/:id').put(catCtrl.update);
    router.route('/cat/:id').delete(catCtrl.delete);*/

  // Users
  // router.route('/login').post(userCtrl.login);
  // router.route('/users').get(userCtrl.getAll);
  // router.route('/users/count').get(userCtrl.count);
  // router.route('/user').post(userCtrl.insert);
  // router.route('/user/:id').get(userCtrl.get);
  // router.route('/user/:id').put(userCtrl.update);
  // router.route('/user/:id').delete(userCtrl.delete);


  export default router;
