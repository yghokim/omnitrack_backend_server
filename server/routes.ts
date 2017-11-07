import * as express from 'express';

import OTSyncCtrl from './controllers/ot_sync_controller';
import OTItemCtrl from './controllers/ot_item_controller';
import OTTrackerCtrl from './controllers/ot_tracker_controller';
import OTTriggerCtrl from './controllers/ot_trigger_controller';
import OTUserCtrl from './controllers/ot_user_controller';
import UserCtrl from './controllers/user';
import User from './models/user';

export default function setRoutes(app) {

  const router = express.Router();

  const itemCtrl = new OTItemCtrl();
  const trackerCtrl = new OTTrackerCtrl();
  const triggerCtrl = new OTTriggerCtrl();
  const userCtrl = new OTUserCtrl();
  const syncCtrl = new OTSyncCtrl(trackerCtrl, triggerCtrl, itemCtrl)

  const firebaseMiddleware = require('express-firebase-middleware');


  // batch
  router.get('/batch/changes', firebaseMiddleware.auth, syncCtrl.batchGetServerChangesAfter)
  router.post('/batch/changes', firebaseMiddleware.auth, syncCtrl.batchPostClientChanges)
  
  router.get('/items/changes', firebaseMiddleware.auth, itemCtrl.getServerChanges)
  router.post('/items/changes', firebaseMiddleware.auth, itemCtrl.postClientChanges)

  router.get('/user/roles', firebaseMiddleware.auth, userCtrl.getRoles)
  router.post('/user/role', firebaseMiddleware.auth, userCtrl.postRole)
  router.put('/user/device', firebaseMiddleware.auth, userCtrl.putDeviceInfo)
  router.post('/user/report', firebaseMiddleware.auth, userCtrl.postReport)
  
  router.route('/items/all').get(itemCtrl.getAll)
  router.route('/users/all').get(userCtrl.getAll)
  router.route('/trackers/all').get(trackerCtrl.getAll)  
  router.route('/triggers/all').get(triggerCtrl.getAll)

  router.route('/trackers/destroy').get(trackerCtrl.destroy)
  router.route('/items/destroy').get(itemCtrl.destroy)
  router.route('/triggers/destroy').get(triggerCtrl.destroy)
/*
  router.route('/items/count').get(catCtrl.count);
  router.route('/cat').post(catCtrl.insert);
  router.route('/cat/:id').get(catCtrl.get);
  router.route('/cat/:id').put(catCtrl.update);
  router.route('/cat/:id').delete(catCtrl.delete);*/

  // Users
  //router.route('/login').post(userCtrl.login);
  //router.route('/users').get(userCtrl.getAll);
  //router.route('/users/count').get(userCtrl.count);
  //router.route('/user').post(userCtrl.insert);
  //router.route('/user/:id').get(userCtrl.get);
  //router.route('/user/:id').put(userCtrl.update);
  //router.route('/user/:id').delete(userCtrl.delete);


  // Apply the routes to our application with the prefix /api
  app.use('/api', router);

}
