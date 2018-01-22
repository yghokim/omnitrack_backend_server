import OTResearchMessage from '../../models/ot_research_message';
import OTExperiment from '../../models/ot_experiment';
import { IResearchMessage, SpecificUsersMessageReceiverRule, MessageReceiverRules } from '../../../omnitrack/core/research/messaging';
import { experimentCtrl } from './ot_experiment_controller';
import app from '../../app';
import { SocketConstants } from '../../../omnitrack/core/research/socket';
import OTParticipant from '../../models/ot_participant';

export default class OTResearchMessageCtrl {

  _enqueueMessage(message : IResearchMessage, experimentId: string): Promise<boolean>{
    delete message["_id"]
    const instance = new OTResearchMessage(message)
    return instance.save().then(savedMessage => {
      if(savedMessage){
        const casted: IResearchMessage = savedMessage as any
        console.log(casted)

        const onSuccess = ()=>{
          app.socketModule().sendUpdateNotificationToExperimentSubscribers(experimentId, {model: SocketConstants.MODEL_RESEARCH_MESSAGE, event: SocketConstants.EVENT_ADDED})
          return true
        }

        if(casted.isDraft != true){
          if(casted.reservedTime){
            //reserve message to agenda
          }
          else{
            //send message immediately
            let receiverUserIds
            switch(casted.receiverRule.type){
              case MessageReceiverRules.SpecificUsersRule:
              receiverUserIds = (casted.receiverRule as SpecificUsersMessageReceiverRule).userId
              break;
            }
            console.log("send message to ")
            console.log(receiverUserIds)
            switch(casted.type){
              case "push":
              return app.pushModule().sendNotificationMessageToUser(receiverUserIds, casted.messageTitle, casted.messageBody).then(
                result=>{
                  console.log(result)
                  const participantQuery: any = {experiment: experimentId}
                  if(receiverUserIds instanceof Array){
                    participantQuery["user"] = {$in: receiverUserIds}
                  }else{
                    participantQuery["user"] = receiverUserIds
                  }
                  
                  return OTParticipant.find(participantQuery, {_id: 1}).then(participants=>{
                    savedMessage["receivers"] = participants.map(p=>p._id)
                    return savedMessage.save().then(saved=>{
                      return onSuccess()
                    })
                  })
                }
              )
              
              case "email":
              //TODO send email
              return onSuccess()
            }
          }
        }
        else return onSuccess()
      }
      else false
    })
  }
  
  _getMessageList(experimentId: string, researcherId: string): Promise<Array<IResearchMessage>>{
    return OTExperiment.findOne(experimentCtrl.makeExperimentAndCorrespondingResearcherQuery(experimentId, researcherId)).then(experiment => {
      if(experiment){
        return OTResearchMessage.find({experiment: experimentId}).then(res => res as any)
      }
      else{
        return Promise.reject("No such experiment with corresponding researcher")
      }
    }) 
  }

  getMessageList = (req, res) => {
    this._getMessageList(req.params.experimentId, req.researcher.uid).then(messages => {
      console.log("messages: ")
      console.log(messages)
      res.status(200).send(messages)
    }).catch(err=>{
      console.log(err)
      res.status(500).send(err)
    })
  }

  enqueueMessage = (req, res) => {
    this._enqueueMessage(req.body, req.params.experimentId).then(success=>{
      if(success===true){
        res.status(200).send(success)
      }
      else{
        res.status(200).send(false)
      }
    }).catch(err=>{
      console.log(err)
      res.status(500).send(err)
    })
  }
}

const messageCtrl = new OTResearchMessageCtrl()
export { messageCtrl }