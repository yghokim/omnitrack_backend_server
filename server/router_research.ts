import * as express from 'express';
import { env } from './app';
import OTResearcher from './models/ot_researcher';
import OTResearchAuthCtrl from './controllers/ot_research_auth_controller';
import AdminCtrl from "./controllers/admin_controller";
import OTExperimentCtrl from './controllers/ot_experiment_controller';
var jwt = require('express-jwt');
const OAuthServer = require('express-oauth-server');
const router = express.Router()

const experimentCtrl = new OTExperimentCtrl()
const researchAuthCtrl = new OTResearchAuthCtrl()
const adminCtrl = new AdminCtrl()

const tokenAuth = jwt({secret: env.jwt_secret, userProperty: 'researcher'})

/*
router.post('/oauth/authorize', oauth.authorize())
router.post('/oauth/token', oauth.token())
*/

router.use("/secure", tokenAuth);

router.post('/auth/authenticate', researchAuthCtrl.authenticate)
router.post('/auth/register', researchAuthCtrl.registerResearcher)

router.get('/experiments/all', tokenAuth, experimentCtrl.getExperimentInformationsOfResearcher)
router.get('/experiments/:experimentId', tokenAuth, experimentCtrl.getExperiment)

//debuging
router.get('/debug/clear_researchers', adminCtrl.clearResearchers)

export default router;