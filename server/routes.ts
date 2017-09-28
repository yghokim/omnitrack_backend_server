import * as express from 'express';

import OTItemCtrl from './controllers/ot_item_controller';
import UserCtrl from './controllers/user';
import User from './models/user';

export default function setRoutes(app) {

  const router = express.Router();

  const itemCtrl = new OTItemCtrl();
  const userCtrl = new UserCtrl();

  // Items
  router.route('/items/changes').get(itemCtrl.getServerChanges)
  router.route('/items/changes').post(itemCtrl.postLocalChanges)
  router.route('/items/all').get(itemCtrl.getAll)
/*
  router.route('/items/count').get(catCtrl.count);
  router.route('/cat').post(catCtrl.insert);
  router.route('/cat/:id').get(catCtrl.get);
  router.route('/cat/:id').put(catCtrl.update);
  router.route('/cat/:id').delete(catCtrl.delete);*/

  // Users
  router.route('/login').post(userCtrl.login);
  router.route('/users').get(userCtrl.getAll);
  router.route('/users/count').get(userCtrl.count);
  router.route('/user').post(userCtrl.insert);
  router.route('/user/:id').get(userCtrl.get);
  router.route('/user/:id').put(userCtrl.update);
  router.route('/user/:id').delete(userCtrl.delete);

  // Apply the routes to our application with the prefix /api
  app.use('/api', router);

}
