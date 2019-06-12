import { IUserDbEntity } from "../../omnitrack/core/db-entity-types";
import { IJoinedExperimentInfo } from "../../omnitrack/core/research/experiment";
import app from "../app";
import OTInvitation from "../models/ot_invitation";
import OTExperiment from "../models/ot_experiment";
import { AInvitation } from "../../omnitrack/core/research/invitation";

export function selfAssignParticipantToExperiment(user: IUserDbEntity, invitationCode: string, experimentId: string, demographic: any): Promise<IJoinedExperimentInfo> {
  return findInvitation(invitationCode, experimentId)
    .then(invitation => getGroupFromInvitation(invitation))
    .then(result => processExperimentAndUser(user, experimentId, result.groupId, result.invitationId, null, demographic))
}

export function researcherAssignParticipantToExperiment(user: IUserDbEntity, experimentId: string, groupId: string, alias?: string, demographic?: any): Promise<IJoinedExperimentInfo> {
  return processExperimentAndUser(user, experimentId, groupId, null, alias, demographic)
}

function findInvitation(invitationCode: string, experimentId: string): Promise<any> {
  return OTInvitation.findOne({
    code: invitationCode,
    experiment: experimentId,
    $or: [
      { "experiment.finishDate": { $gt: new Date() } },
      { "experiment.finishDate": null }
    ]
  }, { _id: 1, experiment: 1, groupMechanism: 1 }).lean().then(doc => {
    if (doc) { return doc }
    else {
      throw { error: "IllegalInvitationCodeOrClosedExperiment" }
    }
  })
}

function getGroupFromInvitation(invitation: any): { invitationId: string, groupId: string } {
  const typedInvitation = AInvitation.fromJson((invitation as any).groupMechanism)
  const groupId = typedInvitation.pickGroup()
  return { invitationId: invitation._id, groupId: groupId }
}

function processExperimentAndUser(user: IUserDbEntity, experimentId: string, groupId: string, invitationId?: string, alias?: string, demographic?: any): Promise<IJoinedExperimentInfo> {

  return OTExperiment.findOneAndUpdate({
    _id: experimentId,
    "groups._id": groupId,
  }, { $inc: { participantNumberSeed: alias ? 0 : 1 } }, { new: true, select: { _id: 1, name: 1, participantNumberSeed: 1, groups: 1, trackingPlans: 1 } })
    .lean()
    .then(experiment => {
      let trackingPackage
      const group = experiment.groups.find(g => g._id === groupId)
      if (group.trackingPlanKey) {
        trackingPackage = (experiment.trackingPlans || []).find(p => p.key === group.trackingPlanKey)
      }

      user.name =
        user.participationInfo.groupId = groupId
      user.participationInfo.alias = alias || "P" + experiment["participantNumberSeed"]
      user.participationInfo.invitation = invitationId
      user.participationInfo.dropped = false
      user.participationInfo.droppedAt = null
      user.participationInfo.droppedBy = null
      user.participationInfo.demographic = demographic
      const now = Date()
      user.participationInfo.approvedAt = now as any
      user.participationInfo.experimentRange.from = now as any

      const joinedExperimentInfo = {
        id: experiment._id,
        name: experiment.name,
        droppedAt: null,
        joinedAt: user.participationInfo.approvedAt.getTime()
      } as IJoinedExperimentInfo

      if (trackingPackage) {
        if (trackingPackage.data.app && trackingPackage.data.app.lockedProperties) {
          user.appFlags = trackingPackage.data.app.lockedProperties
        }

        //inject tracking package
        return app.omnitrackModule().injectPackage(user._id, trackingPackage.data,
          { injected: true, experiment: experiment._id }).then(res => {
            return joinedExperimentInfo
          })
      } else {
        //not inject tracking package
        return joinedExperimentInfo
      }
    })
}