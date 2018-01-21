import OTResearchMessage from '../../models/ot_research_message';
import OTExperiment from '../../models/ot_experiment';
import { IResearchMessage } from '../../../omnitrack/core/research/messaging';
import { experimentCtrl } from './ot_experiment_controller';
import app from '../../app';
import { SocketConstants } from '../../../omnitrack/core/research/socket';

export default class OTResearchMessageCtrl {

  _enqueueMessage(message : IResearchMessage, experimentId: string): Promise<boolean>{
    delete message["_id"]
    const instance = new OTResearchMessage(message)
    return instance.save().then(savedMessage => {
      if(savedMessage){
        const casted: IResearchMessage = savedMessage as any
        console.log(casted)
        if(casted.isDraft != true){
          if(casted.reservedTime){
            //reserve message to agenda
          }
          else{
            //send message immediately
            
          }
        }
        app.socketModule().sendUpdateNotificationToExperimentSubscribers(experimentId, {model: SocketConstants.MODEL_RESEARCH_MESSAGE, event: SocketConstants.EVENT_ADDED})
        return true
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