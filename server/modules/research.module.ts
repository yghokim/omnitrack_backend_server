import * as mongoose from 'mongoose';
import OTUser from '../models/ot_user';
import OTTracker from '../models/ot_tracker';
import OTTrigger from '../models/ot_trigger';
import OTItem from '../models/ot_item';
import OTResearcher from '../models/ot_researcher';
import OTExperiment from '../models/ot_experiment';
import OTInvitation from '../models/ot_invitation';
import OTParticipant from '../models/ot_participant';
import { AInvitation } from '../../omnitrack/core/research/invitation';

import { IJoinedExperimentInfo } from '../../omnitrack/core/research/experiment';
import app from '../app';
import C from '../server_consts'
import { Document } from 'mongoose';

export default class ResearchModule {
  sendInvitationToUser(invitationCode: string, userId: string, force: boolean): PromiseLike<{ invitationAlreadySent: boolean, participant: any }> {
    return OTParticipant.findOne({ user: userId, "invitation.code": invitationCode }).then(participantDoc => {
      let sendAgain = false
      let reject = false
      if (participantDoc) {
        if (force === true) {
          reject = false
          sendAgain = true
        } else {
          reject = true
          sendAgain = false
        }
      }

      if (reject === true) {
        return { invitationAlreadySent: true, participant: participantDoc }
      } else {
        return this.makeParticipantInstanceFromInvitation(invitationCode, userId).then(document => document.save().then(doc => {
          // TODO send push notification to user
          return { invitationAlreadySent: sendAgain, participant: doc }
        })
        )
      }
    }
    )
  }

  makeParticipantInstanceFromInvitation(invitationCode: string, userId: string): Promise<Document> {
    return OTInvitation.findOne({ code: invitationCode }).then(
      invitation => {
        const typedInvitation = AInvitation.fromJson((invitation as any).groupMechanism)
        const groupId = typedInvitation.pickGroup()
        return new OTParticipant({
          user: userId,
          invitation: mongoose.Types.ObjectId(invitation._id),
          experiment: invitation["experiment"],
          groupId: groupId
        })
      })
  }

  removeParticipant(participantId): Promise<any> {
    return OTParticipant.findOneAndRemove({ _id: participantId }).then(removedParticipant => {
      const part = (removedParticipant as any)
      if (!part.isDenied && !part.isConsentApproved) {
        // TODO remove push notification to user
      }
      return part
    })
  }

  dropOutFromExperiment(userId: string, experimentId: string, reason?: string, researcherId?: string): Promise<boolean> {
    return OTParticipant.findOneAndUpdate({"user._id": userId, experiment: experimentId }, {
      dropped: true, 
      droppedBy: researcherId, 
      droppedReason: reason,
      droppedAt: new Date()}).then(participant => {
      if(participant){
        //TODO remove trackers, triggers, items, and medias associated with the experiment
        return Promise.all([OTTracker, OTItem, OTTrigger].map(model => {
          return model.update({
            "flags.injected": true,
            "flags.experiment": experimentId
          }, {removed: true, userUpdatedAt: new Date().getTime()}).exec()
        })).then( objRemovalResult => {
          console.log(objRemovalResult)
          app.serverModule().registerMessageDataPush(userId, app.pushModule().makeFullSyncMessageData())
          return true
        })
      }
      return true
    })
  }

  /**
   * Handles the participation process after the user approved the invitation.
   * @param userId
   * @param invitationCode
   */
  handleInvitationApproval(userId: string, invitationCode: string): Promise<{ success: boolean, injectionExists: boolean, experiment?:IJoinedExperimentInfo  }> {
    const joinedDate = new Date()
    // find participant information
    return OTParticipant.findOneAndUpdate({ "user._id": userId, "invitation.code": invitationCode }, {
      isDenied: false,
      isConsentApproved: true,
      approvedAt: joinedDate
    }).populate("experiment").then(changedParticipant =>{
      if(changedParticipant==null)
      {
        return this.makeParticipantInstanceFromInvitation(invitationCode, userId).then(newParticipant=>{
          newParticipant["isDenied"] = false
          newParticipant["isConsentApproved"] = true
          newParticipant["approvedAt"] = joinedDate
          return newParticipant.save().then(participant=>{
            return participant.populate("experiment").execPopulate()
          })
        })
      }
      else return changedParticipant
    }).then(changedParticipant=> {
      if (changedParticipant) {
        const groupId = changedParticipant["groupId"]
        const experiment = changedParticipant["experiment"]
        const experimentInfo : IJoinedExperimentInfo = {id: experiment._id.toString(), name: experiment.name.toString(), joinedAt: joinedDate.getDate()} 
        const group = experiment.groups.find(g => g._id === groupId)
        if (group && group.trackingPackageKey) {
          const trackingPackage = (experiment.trackingPackages || []).find(p => p.key === group.trackingPackageKey)
          if (trackingPackage) {
            console.log("inject trackingPackage '" + trackingPackage.name + "' to user " + userId)

            return app.omnitrackModule().injectPackage(userId, trackingPackage.data, {
              injected: true,
              experiment: experiment._id
            }).then(res => {
              return { success: true, injectionExists: true, experiment: experimentInfo}
            })
          } else {
            return Promise.reject("The group contains trackingPackage which does not exist in the experiment.")
          }
        } else { return { success: true, injectionExists: false, experiment: experimentInfo} }
      } else {
        return Promise.reject("The invitation is no longer available.")
      }
    })
  }


}