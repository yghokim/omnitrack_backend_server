import * as express from 'express';
import env from './env';
import OTResearcher from './models/ot_researcher';
import OTResearchAuthCtrl from './controllers/ot_research_auth_controller';
import AdminCtrl from "./controllers/admin_controller";
import OTResearchCtrl from './controllers/ot_research_controller';
import { experimentCtrl } from './controllers/research/ot_experiment_controller';
import { messageCtrl } from './controllers/research/ot_message_controller';
import { clientBinaryCtrl } from './controllers/research/ot_client_binary_controller';
import { OTUsageLogCtrl } from './controllers/ot_usage_log_controller';
import OTUserCtrl from './controllers/ot_user_controller';
import ot_tracker from './models/ot_tracker';
import ot_trigger from './models/ot_trigger';
import ot_item from './models/ot_item';
import { trackingDataCtrl } from './controllers/research/ot_tracking_data_controller';
import { ResearcherPrevilages } from '../omnitrack/core/research/researcher';
import BinaryStorageCtrl from './controllers/binary_storage_controller';
import { itemCtrl } from './controllers/ot_item_controller';
import { participantCtrl } from './controllers/research/ot_participant_controller';

const jwt = require('express-jwt');
const OAuthServer = require('express-oauth-server');
const router = express.Router()

const researchCtrl = new OTResearchCtrl()
const researchAuthCtrl = new OTResearchAuthCtrl()
const adminCtrl = new AdminCtrl()
const userCtrl = new OTUserCtrl()
const storageCtrl = new BinaryStorageCtrl()
const usageLogCtrl = new OTUsageLogCtrl()

function makeTokenAuthMiddleware(pipe: (reseaercher, parsedToken?) => string = () => { return null }): any {
  return jwt({
    secret: env.jwt_secret, userProperty: 'researcher', isRevoked: (req, payload, done) => {
      OTResearcher.findById(payload.uid, (idFindErr, researcher) => {
        if (idFindErr) {
          done(idFindErr, true)
          return
        }
        else if (researcher) {
          const pipeResult = pipe(researcher)
          if (pipeResult) {
            done(pipeResult, true)
          }
          else if (payload.iat < (researcher["passwordSetAt"] || researcher["createdAt"]).getTime() / 1000) {
            done("passwordChanged", true)
          }
          else done(null, false)
        }
        else done(null, true)
      })
    }
  })
}

const tokenApprovedAuth = makeTokenAuthMiddleware((researcher) => {
  switch (researcher["account_approved"]) {
    case true: return null;
    case false: return "AccountDeclined";
    case undefined: return "AccountApprovalPending"
  }
})

const tokenAdminAuth = makeTokenAuthMiddleware((researcher) => {
  const previlage = (env.super_users as Array<string> || []).indexOf(researcher.email) !== -1 ? ResearcherPrevilages.SUPERUSER : ResearcherPrevilages.NORMAL

  return previlage >= ResearcherPrevilages.ADMIN ? null : "NotAdmin"
})

const tokenSignedInAuth = makeTokenAuthMiddleware()

/*
router.post('/oauth/authorize', oauth.authorize())
router.post('/oauth/token', oauth.token())
*/

router.post('/auth/authenticate', researchAuthCtrl.authenticate)
router.post('/auth/register', researchAuthCtrl.registerResearcher)
router.post('/auth/update', tokenApprovedAuth, researchAuthCtrl.update)
router.post('/auth/verify', tokenSignedInAuth, researchAuthCtrl.verifyToken)

//Admin API===================================================
router.post('/clients/upload', tokenAdminAuth, clientBinaryCtrl.postClientBinaryFile)
router.delete("/clients/:binaryId", tokenAdminAuth, clientBinaryCtrl.removeClientBinary)

router.get('/researchers/all', tokenAdminAuth, researchCtrl.getResearchers)
router.post('/researchers/:researcherId/approve', tokenAdminAuth, researchCtrl.setResearcherAccountApproved)
//=============================================================


router.get("/experiments/examples", experimentCtrl.getExampleExperimentList)
router.post("/experiments/examples", tokenApprovedAuth, experimentCtrl.addExampleExperiment)

router.post('/experiments/new', tokenApprovedAuth, experimentCtrl.createExperiment)
router.get('/experiments/all', tokenApprovedAuth, experimentCtrl.getExperimentInformationsOfResearcher)
router.get('/experiments/:experimentId', tokenApprovedAuth, experimentCtrl.getExperiment)

router.post('/experiments/:experimentId/update', tokenApprovedAuth, experimentCtrl.updateExperiment)

router.post('/experiments/:experimentId/messages/new', tokenApprovedAuth, messageCtrl.enqueueMessage)
router.get('/experiments/:experimentId/messages', tokenApprovedAuth, messageCtrl.getMessageList)

router.post('/experiments/:experimentId/update', tokenApprovedAuth, experimentCtrl.updateExperiment)


router.delete('/experiments/:experimentId', tokenApprovedAuth, experimentCtrl.removeExperiment)


router.post("/experiments/:experimentId/collaborators/new", tokenApprovedAuth, experimentCtrl.addCollaborator)

router.post("/experiments/:experimentId/collaborators/update", tokenApprovedAuth, experimentCtrl.updateCollaboratorPermissions)

router.get('/experiments/manager/:experimentId', tokenApprovedAuth, experimentCtrl.getManagerInfo)

router.get('/experiments/:experimentId/invitations', tokenApprovedAuth, researchCtrl.getInvitations)

router.get('/experiments/:experimentId/participants', tokenApprovedAuth, researchCtrl.getParticipants)

router.post('/experiments/:experimentId/invitations/new', tokenApprovedAuth, researchCtrl.addNewIntivation)

router.post('/experiments/:experimentId/invitations/send', tokenApprovedAuth, researchCtrl.sendInvitation)

router.delete('/experiments/:experimentId/invitations/:invitationId', tokenApprovedAuth, researchCtrl.removeInvitation)

router.post('/users/notify/message', tokenApprovedAuth, researchCtrl.sendNotificationMessageToUser)

router.delete('/participants/:participantId', tokenApprovedAuth, researchCtrl.removeParticipant)

router.post('/participants/:participantId/alias', tokenApprovedAuth, researchCtrl.changeParticipantAlias)

router.post('/participants/:participantId/update', tokenApprovedAuth, researchCtrl.updateParticipant)

router.get("/researchers/search", tokenApprovedAuth, researchCtrl.searchResearchers)

router.delete("/users/:userId", tokenApprovedAuth, userCtrl.deleteAccount)

router.delete("/participants/:participantId/drop", tokenApprovedAuth, researchCtrl.dropOutFromExperiment)

router.post('/participants/:participantId/excluded_days', tokenApprovedAuth, participantCtrl.postExcludedDays)


//tracking data
new Array(
  { url: "trackers", model: ot_tracker },
  { url: "triggers", model: ot_trigger },
  { url: "items", model: ot_item }).forEach(
    info => {
      router.get('/experiments/:experimentId/data/' + info.url, tokenApprovedAuth, trackingDataCtrl.getChildrenOfExperiment(info.model))
    }
  )

router.get('/files/item_media/:trackerId/:itemId/:attrLocalId/:fileIdentifier/:processingType?', tokenApprovedAuth, storageCtrl.downloadItemMedia)

//data manipulation
router.post("/tracking/update/item_column", tokenApprovedAuth, itemCtrl.postItemValue)

router.post("/tracking/update/item_timestamp", tokenApprovedAuth, itemCtrl.postItemTimestamp)


router.get("/users/all", tokenApprovedAuth, researchCtrl.getUsersWithPariticipantInformation)

// debuging
router.get("/debug/generate_participant_alias", researchCtrl.generateAliasOfParticipants)
router.get('/debug/clear_researchers', adminCtrl.clearResearchers)
router.get('/debug/remove_researcher/:researcherId', adminCtrl.removeResearcher)
router.get('/debug/push_users', adminCtrl.pushUsers)
router.get('/debug/participants/all', researchCtrl.getallParticipants)
router.get('/debug/restore_experiment_data/:experimentId', experimentCtrl.restoreExperimentTrackingEntities)
router.get('/debug/push_command', experimentCtrl.sendPushCommand)

export default router;
