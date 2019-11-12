
import OTResearchMessage from '../../models/ot_research_message';
import OTExperiment from '../../models/ot_experiment';
import { IResearchMessage, SpecificUsersMessageReceiverRule, MessageReceiverRules } from '../../../omnitrack/core/research/messaging';
import { experimentCtrl } from './ot_experiment_controller';
import app from '../../app';
import env from '../../env';
import { SocketConstants } from '../../../omnitrack/core/research/socket';
import { TextMessageData } from '../../modules/push.module';

export default class OTResearchMessageCtrl {

  private mailer: any

  constructor() {
    if (env && env.mailer && env.mailer.api_key) {
      console.log("use mailer.")
      this.mailer = require('@sendgrid/mail');
      this.mailer.setApiKey(env.mailer.api_key);

      console.log(this.mailer)
    }
  }

  public sendEmailTo(messageTitle: string, messageBody: string, emails: Array<string>): Promise<Array<{ email: string, success: boolean, data: any }>> {
    return Promise.all(emails.map(email => {
      const emailBody: any = {
        from: { email: env.mailer.sender_email, name: env.mailer.sender_name },
        to: email,
        subject: messageTitle,
        html: messageBody
      }

      return this.mailer.send(emailBody).then(data => {
        console.log(data)
        return { success: true, email: email, data: data }
      }).catch(err => {
        console.log(err)
        return { success: false, email: email, data: err }
      })
    }))

  }

  _enqueueMessage(message: IResearchMessage, experimentId: string): Promise<IResearchMessage> {
    delete message["_id"]
    const instance = new OTResearchMessage(message)
    return instance.save().then(savedMessage => {
      if (savedMessage) {
        const casted: IResearchMessage = savedMessage as any
        console.log(casted)

        const onSuccess = () => {
          app.socketModule().sendUpdateNotificationToExperimentSubscribers(experimentId, { model: SocketConstants.MODEL_RESEARCH_MESSAGE, event: SocketConstants.EVENT_ADDED })
          return savedMessage.populate({ path: "receivers", select: "_id alias" }).execPopulate().then(doc => doc.toJSON())
        }

        if (casted.isDraft !== true) {
          if (casted.reservedTime) {
            // reserve message to agenda
          } else {
            // send message immediately
            let receiverUserIds
            switch (casted.receiverRule.type) {
              case MessageReceiverRules.SpecificUsersRule:
                receiverUserIds = (casted.receiverRule as SpecificUsersMessageReceiverRule).userId
                break;
            }
            console.log("send message to ")
            console.log(receiverUserIds)
            const participantQuery: any = { experiment: experimentId }
            if (receiverUserIds instanceof Array) {
              participantQuery["user"] = { $in: receiverUserIds }
            } else {
              participantQuery["user"] = receiverUserIds
            }

            switch (casted.type) {
              case "push":
                return app.pushModule().sendDataMessageToUser(receiverUserIds, new TextMessageData(casted.messageTitle, casted.messageBody)).then(
                  result => {
                    console.log(result)
                    savedMessage["receivers"] = receiverUserIds
                    savedMessage["sentAt"] = new Date()
                    return savedMessage.save().then(saved => {
                      return onSuccess()
                    })
                  }
                )

                /*
              case "email":
                return OTParticipant.find(participantQuery, { _id: 1, user: 1 }).populate({ path: "user", select: "_id email" }).then(participants => {
                  if (participants && participants.length > 0) {
                    return this.sendEmailTo(
                      casted.messageTitle,
                      casted.messageBody,
                      participants.map(p => p["user"]["email"])).then(result => {
                        savedMessage["receivers"] = result.filter(r => r.success === true).map(r => participants.find(p => p["user"]["email"] === r.email)._id)
                        savedMessage["sentAt"] = new Date()
                        return savedMessage.save().then(saved => {
                          return onSuccess()
                        })
                      })
                  } else { return null }
                })*/
            }
          }
        } else { return onSuccess() }
      } else { return null }
    })
  }

  _getMessageList(experimentId: string, researcherId: string): Promise<Array<IResearchMessage>> {
    return OTExperiment.findOne(experimentCtrl.makeExperimentAndCorrespondingResearcherQuery(experimentId, researcherId)).then(experiment => {
      if (experiment) {
        return OTResearchMessage.find({ experiment: experimentId })
          .populate({ path: "receivers", select: "_id alias" })
          .then(res => res as any)
      } else {
        return Promise.reject("No such experiment with corresponding researcher")
      }
    })
  }

  getMessageList = (req, res) => {
    this._getMessageList(req.params.experimentId, req.researcher.uid).then(messages => {
      res.status(200).send(messages)
    }).catch(err => {
      console.error(err)
      res.status(500).send(err)
    })
  }

  enqueueMessage = (req, res) => {
    this._enqueueMessage(req.body, req.params.experimentId).then(newMessage => {
      if (newMessage) {
        res.status(200).send(newMessage)
      } else {
        res.status(200).send(null)
      }
    }).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }
}

const messageCtrl = new OTResearchMessageCtrl()
export { messageCtrl }