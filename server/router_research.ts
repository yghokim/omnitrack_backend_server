import * as express from 'express';
import { env } from './app';
import OTResearcher from './models/ot_researcher';
import OTResearchAuthCtrl from './controllers/ot_research_auth_controller';
var jwt = require('express-jwt');
const OAuthServer = require('express-oauth-server');
const router = express.Router()

const researchAuthCtrl = new OTResearchAuthCtrl()

const tokenAuth = jwt({secret: env.jwt_secret, userProperty: 'payload'})

/*
router.post('/oauth/authorize', oauth.authorize())
router.post('/oauth/token', oauth.token())
*/

router.use("/secure", tokenAuth);

router.post('/auth/authenticate', researchAuthCtrl.authenticate)
router.post('/auth/register', researchAuthCtrl.registerResearcher)

export default router;