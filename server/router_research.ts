import * as express from 'express';
import env from './env';
import OTResearcher from './models/ot_researcher';
import OTResearchAuthCtrl from './controllers/ot_research_auth_controller';
import AdminCtrl from "./controllers/admin_controller";
import OTResearchCtrl from './controllers/ot_research_controller';
import OTUserCtrl from './controllers/ot_user_controller';
const jwt = require('express-jwt');
const OAuthServer = require('express-oauth-server');
const router = express.Router()

const researchCtrl = new OTResearchCtrl()
const researchAuthCtrl = new OTResearchAuthCtrl()
const adminCtrl = new AdminCtrl()
const userCtrl = new OTUserCtrl()

const tokenAuth = jwt({secret: env.jwt_secret, userProperty: 'researcher'})

/*
router.post('/oauth/authorize', oauth.authorize())
router.post('/oauth/token', oauth.token())
*/

router.use("/secure", tokenAuth);

router.post('/auth/authenticate', researchAuthCtrl.authenticate)
router.post('/auth/register', researchAuthCtrl.registerResearcher)

router.get('/experiments/all', tokenAuth, researchCtrl.getExperimentInformationsOfResearcher)
router.get('/experiments/:experimentId', tokenAuth, researchCtrl.getExperiment)
router.get('/experiments/manager/:experimentId', tokenAuth, researchCtrl.getManagerInfo)

router.get('/experiments/:experimentId/invitations', tokenAuth, researchCtrl.getInvitations)

router.get('/experiments/:experimentId/participants', tokenAuth, researchCtrl.getParticipants)

router.post('/experiments/:experimentId/invitations/new', tokenAuth, researchCtrl.addNewIntivation)

router.post('/experiments/:experimentId/invitations/send', tokenAuth, researchCtrl.sendInvitation)

router.delete('/experiments/:experimentId/invitations/:invitationId', tokenAuth, researchCtrl.removeInvitation)

router.post('/users/notify/message', tokenAuth, researchCtrl.sendNotificationMessageToUser)

router.delete('/participants/:participantId', tokenAuth, researchCtrl.removeParticipant)

router.delete("/users/:userId", tokenAuth, userCtrl.deleteAccount)

router.get("/users/all", tokenAuth, researchCtrl.getUsersWithPariticipantInformation)

// debuging
router.get('/debug/clear_researchers', adminCtrl.clearResearchers)
router.get('/debug/push_users', adminCtrl.pushUsers)

export default router;