
import env from '../../env';
import OTResearchMessage from '../../models/ot_research_message';
import OTExperiment from '../../models/ot_experiment';
import { IResearchMessage, SpecificUsersMessageReceiverRule, MessageReceiverRules } from '../../../omnitrack/core/research/messaging';
import { experimentCtrl } from './ot_experiment_controller';
import app from '../../app';
import { SocketConstants } from '../../../omnitrack/core/research/socket';
import OTParticipant from '../../models/ot_participant';

export default class OTResearchMessageCtrl {

  private mailer: any

  constructor(){
    if(env.use_mailer === true && env.mailer.api_key)
    {
      console.log("use mailer.")
      this.mailer = require('sib-api-v3-sdk');
      this.mailer.ApiClient.instance.authentications['api-key'].apiKey = env.mailer.api_key

      var api = new this.mailer.AccountApi()
      api.getAccount().then(account => {
        console.log("your Sendinblue account information:")
        console.log(account)
      }).catch(err=>{
        console.log("error while loading the Sendinblue account:")
        console.log(err)
      })
    }
  }

  private sendEmailTo(messageTitle: string, messageBody: string, emails: Array<string>): Promise<Array<{email: string, success: boolean, data: any}>>
  {
    const emailApi = new this.mailer.SMTPApi()
    return Promise.all(emails.map(email => {
      const emailBody = new this.mailer.SendSmtpEmail()
      emailBody.sender = {email: env.mailer.sender_email}
      emailBody.subject = messageTitle
      emailBody.htmlContent = messageBody
      emailBody.to = [{email: email}]
      console.log(emailBody)

      return emailApi.sendTransacEmail(emailBody).then(data=>{
        console.log(data)
        return {success: true, email: email, data: data}
      }).catch(err=>{
        console.log(err)
        return {success: false, email: email, data: err}
      })
    }))
    
  }

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
            const participantQuery: any = {experiment: experimentId}
                  if(receiverUserIds instanceof Array){
                    participantQuery["user"] = {$in: receiverUserIds}
                  }else{
                    participantQuery["user"] = receiverUserIds
                  }

            switch(casted.type){
              case "push":
              return app.pushModule().sendNotificationMessageToUser(receiverUserIds, casted.messageTitle, casted.messageBody).then(
                result=>{
                  console.log(result)
                  return OTParticipant.find(participantQuery, {_id: 1}).then(participants=>{
                    savedMessage["receivers"] = participants.map(p=>p._id)
                    savedMessage["sentAt"] = new Date()
                    return savedMessage.save().then(saved=>{
                      return onSuccess()
                    })
                  })
                }
              )
              
              case "email":
                return OTParticipant.find(participantQuery, {_id: 1, user:1}).populate({path: "user", select: "_id email"}).then(participants => {
                  if(participants && participants.length > 0)
                  {

                  return this.sendEmailTo(
                    casted.messageTitle, 
                    casted.messageBody, 
                    participants.map(p=>p["user"]["email"])).then(result=>{
                      savedMessage["receivers"] = result.filter(r=>r.success === true).map(r=> participants.find(p=>p["user"]["email"] === r.email)._id)
                      savedMessage["sentAt"] = new Date()
                      return savedMessage.save().then(saved=>{
                        return onSuccess()
                      })
                    })
                  }
                  else return false
                })
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
        return OTResearchMessage.find({experiment: experimentId})
          .populate({path: "receivers", select: "_id alias"})
          .then(res => res as any)
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