import * as mongoose from 'mongoose';
import OTUser from '../models/ot_user';
import OTResearcher from '../models/ot_researcher';
import OTExperiment from '../models/ot_experiment';
import OTInvitation from '../models/ot_invitation';
import OTParticipant from '../models/ot_participant';
import { AInvitation } from '../../omnitrack/core/research/invitation';

export default class ResearchModule{
  sendInvitationToUser(invitationCode: string, userId: string, force: boolean): PromiseLike<{invitationAlreadySent: boolean, participant: any}>{
    return OTParticipant.findOne({user: userId, "invitation.code": invitationCode}).then(participantDoc=>{
      var sendAgain = false
      var reject = false
      if(participantDoc)
      {
        if(force == true)
        {
          reject = false
          sendAgain = true
        }
        else{
          reject = true
          sendAgain = false
        }
      }

      if(reject==true)
        {
          return {invitationAlreadySent: true, participant: participantDoc}
        }
        else{
          return OTInvitation.findOne({code: invitationCode}).then(
            invitation=>
            {
              console.log(invitation)
              const typedInvitation = AInvitation.fromJson((invitation as any).groupMechanism)
              const groupId = typedInvitation.pickGroup()
              return new OTParticipant({
                    user: userId,
                    invitation: mongoose.Types.ObjectId(invitation._id),
                    experiment: invitation["experiment"],
                    groupId: groupId
                  }).save().then(doc=>{
                    //TODO send push notification to user
                    return {invitationAlreadySent: sendAgain, participant: doc}
                  })
            })
        }
      }
    )
  }

  removeParticipant(participantId): Promise<any>{
    return OTParticipant.findOneAndRemove({_id: participantId}).then(removedParticipant=>{
      const part = (removedParticipant as any)
      if(!part.isDenied && !part.isConsentApproved)
      {
        //TODO remove push notification to user
      }
      return part
    })
  }
}