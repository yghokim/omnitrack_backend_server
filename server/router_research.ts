import { IEnvironment } from './env';
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
import { clientSignatureCtrl } from './controllers/ot_client_signature_controller';
import { RouterWrapper } from './server_utils';
const jwt = require('express-jwt');

export class ResearchRouter extends RouterWrapper {

  private readonly researchCtrl = new OTResearchCtrl()
  private readonly researchAuthCtrl = new OTResearchAuthCtrl()
  private readonly adminCtrl = new AdminCtrl()
  private readonly userCtrl = new OTUserCtrl()
  private readonly storageCtrl = new BinaryStorageCtrl()
  private readonly usageLogCtrl = new OTUsageLogCtrl()

  constructor(private env: IEnvironment) {
    super()
    const tokenApprovedAuth = this.makeTokenAuthMiddleware((researcher) => {
      switch (researcher["account_approved"]) {
        case true: return null;
        case false: return "AccountDeclined";
        case undefined: return "AccountApprovalPending"
      }
    })

    const tokenAdminAuth = this.makeTokenAuthMiddleware((researcher) => {
      const previlage = (env.super_users as Array<string> || []).indexOf(researcher.email) !== -1 ? ResearcherPrevilages.SUPERUSER : ResearcherPrevilages.NORMAL

      return previlage >= ResearcherPrevilages.ADMIN ? null : "NotAdmin"
    })

    const tokenSignedInAuth = this.makeTokenAuthMiddleware()

    /*
    router.post('/oauth/authorize', oauth.authorize())
    router.post('/oauth/token', oauth.token())
    */

    this.router.post('/auth/authenticate', this.researchAuthCtrl.authenticate)
    this.router.post('/auth/register', this.researchAuthCtrl.registerResearcher)
    this.router.post('/auth/update', tokenApprovedAuth, this.researchAuthCtrl.update)
    this.router.post('/auth/verify', tokenSignedInAuth, this.researchAuthCtrl.verifyToken)

    //Admin API===================================================
    this.router.post('/clients/upload', tokenAdminAuth, clientBinaryCtrl.postClientBinaryFile)
    this.router.delete("/clients/:binaryId", tokenAdminAuth, clientBinaryCtrl.removeClientBinary)
    this.router.post("/clients/:binaryId/delete", tokenAdminAuth, clientBinaryCtrl.removeClientBinary)
    

    this.router.get('/signatures/all', tokenAdminAuth, clientSignatureCtrl.getSignatures)
    this.router.post('/signatures/update', tokenAdminAuth, clientSignatureCtrl.postSignature)
    this.router.delete('/signatures/:id', tokenAdminAuth, clientSignatureCtrl.removeSignature)
    this.router.post('/signatures/:id/delete', tokenAdminAuth, clientSignatureCtrl.removeSignature)
    

    this.router.get('/researchers/all', tokenAdminAuth, this.researchCtrl.getResearchers)
    this.router.post('/researchers/:researcherId/approve', tokenAdminAuth, this.researchCtrl.setResearcherAccountApproved)
    //=============================================================


    this.router.get("/experiments/examples", experimentCtrl.getExampleExperimentList)
    this.router.post("/experiments/examples", tokenApprovedAuth, experimentCtrl.addExampleExperiment)

    this.router.post('/experiments/new', tokenApprovedAuth, experimentCtrl.createExperiment)
    this.router.get('/experiments/all', tokenApprovedAuth, experimentCtrl.getExperimentInformationsOfResearcher)
    this.router.get('/experiments/:experimentId', tokenApprovedAuth, experimentCtrl.getExperiment)

    this.router.post('/experiments/:experimentId/update', tokenApprovedAuth, experimentCtrl.updateExperiment)

    this.router.post('/experiments/:experimentId/messages/new', tokenApprovedAuth, messageCtrl.enqueueMessage)
    this.router.get('/experiments/:experimentId/messages', tokenApprovedAuth, messageCtrl.getMessageList)

    this.router.post('/experiments/:experimentId/update', tokenApprovedAuth, experimentCtrl.updateExperiment)


    this.router.delete('/experiments/:experimentId', tokenApprovedAuth, experimentCtrl.removeExperiment)
    this.router.post('/experiments/:experimentId/delete', tokenApprovedAuth, experimentCtrl.removeExperiment)


    this.router.post("/experiments/:experimentId/collaborators/new", tokenApprovedAuth, experimentCtrl.addCollaborator)

    this.router.post("/experiments/:experimentId/collaborators/update", tokenApprovedAuth, experimentCtrl.updateCollaboratorPermissions)

    this.router.get('/experiments/manager/:experimentId', tokenApprovedAuth, experimentCtrl.getManagerInfo)

    this.router.get('/experiments/:experimentId/invitations', tokenApprovedAuth, this.researchCtrl.getInvitations)

    this.router.get('/experiments/:experimentId/participants', tokenApprovedAuth, this.researchCtrl.getParticipants)

    this.router.post('/experiments/:experimentId/invitations/new', tokenApprovedAuth, this.researchCtrl.addNewIntivation)

    this.router.post('/experiments/:experimentId/invitations/send', tokenApprovedAuth, this.researchCtrl.sendInvitation)

    this.router.delete('/experiments/:experimentId/invitations/:invitationId', tokenApprovedAuth, this.researchCtrl.removeInvitation)
    this.router.post('/experiments/:experimentId/invitations/:invitationId/delete', tokenApprovedAuth, this.researchCtrl.removeInvitation)
    

    this.router.post('/experiments/:experimentId/packages/update', tokenApprovedAuth, experimentCtrl.updateTrackingPackageToExperiment)

    this.router.delete('/experiments/:experimentId/packages/:packageKey', tokenApprovedAuth, experimentCtrl.removeTrackingPackageFromExperiment)
    this.router.post('/experiments/:experimentId/packages/:packageKey/delete', tokenApprovedAuth, experimentCtrl.removeTrackingPackageFromExperiment)
    

    this.router.post('/experiments/:experimentId/groups/upsert', tokenApprovedAuth, experimentCtrl.upsertExperimentGroup)
    this.router.delete('/experiments/:experimentId/groups/:groupId', tokenApprovedAuth, experimentCtrl.removeExperimentGroup)
    this.router.post('/experiments/:experimentId/groups/:groupId/delete', tokenApprovedAuth, experimentCtrl.removeExperimentGroup)
    

    this.router.post('/users/notify/message', tokenApprovedAuth, this.researchCtrl.sendNotificationMessageToUser)

    this.router.delete('/participants/:participantId', tokenApprovedAuth, this.researchCtrl.removeParticipant)
    this.router.post('/participants/:participantId/delete', tokenApprovedAuth, this.researchCtrl.removeParticipant)
    

    this.router.post('/participants/:participantId/alias', tokenApprovedAuth, this.researchCtrl.changeParticipantAlias)

    this.router.post('/participants/:participantId/update', tokenApprovedAuth, this.researchCtrl.updateParticipant)

    this.router.get("/researchers/search", tokenApprovedAuth, this.researchCtrl.searchResearchers)

    this.router.delete("/users/:userId", tokenApprovedAuth, this.userCtrl.deleteAccount)
    this.router.post("/users/:userId/delete", tokenApprovedAuth, this.userCtrl.deleteAccount)
    

    this.router.post("/participants/:participantId/drop", tokenApprovedAuth, this.researchCtrl.dropOutFromExperiment)
    

    this.router.post('/participants/:participantId/excluded_days', tokenApprovedAuth, participantCtrl.postExcludedDays)

    this.router.get('/usage_logs', tokenApprovedAuth, this.usageLogCtrl.getFilteredUserGroupedUsageLogs)

    //tracking data
    new Array(
      { url: "trackers", model: ot_tracker },
      { url: "triggers", model: ot_trigger },
      { url: "items", model: ot_item }).forEach(
        info => {
          this.router.get('/experiments/:experimentId/data/' + info.url, tokenApprovedAuth, trackingDataCtrl.getChildrenOfExperiment(info.model))
        }
      )

    this.router.get('/files/item_media/:trackerId/:itemId/:attrLocalId/:fileIdentifier/:processingType?', tokenApprovedAuth, this.storageCtrl.downloadItemMedia)

    //data manipulation
    this.router.post("/tracking/update/item_column", tokenApprovedAuth, itemCtrl.postItemValue)

    this.router.post("/tracking/update/item_timestamp", tokenApprovedAuth, itemCtrl.postItemTimestamp)


    this.router.get("/users/all", tokenApprovedAuth, this.researchCtrl.getUsersWithPariticipantInformation)

    // debuging
    this.router.get("/debug/generate_participant_alias", this.researchCtrl.generateAliasOfParticipants)
    this.router.get('/debug/clear_researchers', this.adminCtrl.clearResearchers)
    this.router.get('/debug/remove_researcher/:researcherId', this.adminCtrl.removeResearcher)
    this.router.get('/debug/push_users', this.adminCtrl.pushUsers)
    this.router.get('/debug/participants/all', this.researchCtrl.getallParticipants)
    this.router.get('/debug/restore_experiment_data/:experimentId', experimentCtrl.restoreExperimentTrackingEntities)
    this.router.get('/debug/push_command', experimentCtrl.sendPushCommand)

    const methodTestHandler = (req, res) => {
      res.status(200).send(true)
    }

    this.router.get('/debug/test_http_method/get', methodTestHandler)
    this.router.post('/debug/test_http_method/post', methodTestHandler)
    this.router.put('/debug/test_http_method/put', methodTestHandler)
    this.router.delete('/debug/test_http_method/delete', methodTestHandler)
    this.router.options('/debug/test_http_method/options', methodTestHandler)
  }


  private makeTokenAuthMiddleware(pipe: (reseaercher, parsedToken?) => string = () => { return null }): any {
    return jwt({
      secret: this.env.jwt_secret, userProperty: 'researcher', isRevoked: (req, payload, done) => {
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
}