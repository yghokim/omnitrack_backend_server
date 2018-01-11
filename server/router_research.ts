import * as express from 'express';
import env from './env';
import OTResearcher from './models/ot_researcher';
import OTResearchAuthCtrl from './controllers/ot_research_auth_controller';
import AdminCtrl from "./controllers/admin_controller";
import OTResearchCtrl from './controllers/ot_research_controller';
import { experimentCtrl } from './controllers/research/ot_experiment_controller';
import OTUserCtrl from './controllers/ot_user_controller';
import ot_tracker from './models/ot_tracker';
import ot_trigger from './models/ot_trigger';
import ot_item from './models/ot_item';
import { trackingDataCtrl } from './controllers/research/ot_tracking_data_controller';
const jwt = require('express-jwt');
const OAuthServer = require('express-oauth-server');
const router = express.Router()

const researchCtrl = new OTResearchCtrl()
const researchAuthCtrl = new OTResearchAuthCtrl()
const adminCtrl = new AdminCtrl()
const userCtrl = new OTUserCtrl()

const tokenAuth = jwt({secret: env.jwt_secret, userProperty: 'researcher', isRevoked: (req, payload, done)=>{
  OTResearcher.findById(payload.uid, (idFindErr, researcher) => {
    if(idFindErr)
    {
      done(idFindErr, true)
      return
    }
    else if(researcher)
    {
      if(payload.iat < (researcher["passwordSetAt"] || researcher["createdAt"]).getTime()/1000)
      {
        done("passwordChanged", true)
      }
      else done(null, false)
    }
    else done(null, true)
  })
}})

/*
router.post('/oauth/authorize', oauth.authorize())
router.post('/oauth/token', oauth.token())
*/

router.use("/secure", tokenAuth);

router.post('/auth/authenticate', researchAuthCtrl.authenticate)
router.post('/auth/register', researchAuthCtrl.registerResearcher)

router.post('/auth/verify', tokenAuth, researchAuthCtrl.verifyToken)

router.get('/experiments/all', tokenAuth, experimentCtrl.getExperimentInformationsOfResearcher)
router.get('/experiments/:experimentId', tokenAuth, experimentCtrl.getExperiment)

router.post("/experiments/:experimentId/collaborators/new", tokenAuth, experimentCtrl.addCollaborator)

router.post("/experiments/:experimentId/collaborators/update", tokenAuth, experimentCtrl.updateCollaboratorPermissions)

router.get('/experiments/manager/:experimentId', tokenAuth, experimentCtrl.getManagerInfo)

router.get('/experiments/:experimentId/invitations', tokenAuth, researchCtrl.getInvitations)

router.get('/experiments/:experimentId/participants', tokenAuth, researchCtrl.getParticipants)

router.post('/experiments/:experimentId/invitations/new', tokenAuth, researchCtrl.addNewIntivation)

router.post('/experiments/:experimentId/invitations/send', tokenAuth, researchCtrl.sendInvitation)

router.delete('/experiments/:experimentId/invitations/:invitationId', tokenAuth, researchCtrl.removeInvitation)

router.post('/users/notify/message', tokenAuth, researchCtrl.sendNotificationMessageToUser)

router.delete('/participants/:participantId', tokenAuth, researchCtrl.removeParticipant)

router.post('/participants/:participantId/alias', tokenAuth, researchCtrl.changeParticipantAlias)

router.get("/researchers/search", tokenAuth, researchCtrl.searchResearchers)

router.delete("/users/:userId", tokenAuth, userCtrl.deleteAccount)

router.delete("/participants/:participantId/drop", tokenAuth, researchCtrl.dropOutFromExperiment)


//tracking data
new Array(
  {url: "trackers", model: ot_tracker}, 
  {url:"triggers", model: ot_trigger}, 
  {url:"items", model: ot_item}).forEach(
    info=>{
      router.get('/experiments/:experimentId/data/' + info.url, trackingDataCtrl.getChildrenOfExperiment(info.model))
    }
  )


router.get("/users/all", tokenAuth, researchCtrl.getUsersWithPariticipantInformation)

// debuging
router.get("/debug/generate_participant_alias", researchCtrl.generateAliasOfParticipants)
router.get('/debug/clear_researchers', adminCtrl.clearResearchers)
router.get('/debug/remove_researcher/:researcherId', adminCtrl.removeResearcher)
router.get('/debug/push_users', adminCtrl.pushUsers)
router.get('/debug/participants/all', researchCtrl.getallParticipants)

export default router;