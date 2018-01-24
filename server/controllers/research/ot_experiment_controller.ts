import OTUser from '../../models/ot_user'
import OTTrigger from '../../models/ot_trigger'
import OTTracker from '../../models/ot_tracker'
import OTResearcher from '../../models/ot_researcher'
import OTExperiment from '../../models/ot_experiment'
import OTInvitation from '../../models/ot_invitation'
import OTParticipant from '../../models/ot_participant'
import { IJoinedExperimentInfo, ExperimentPermissions } from '../../../omnitrack/core/research/experiment'
import { Document } from 'mongoose';
import app from '../../app';
import { SocketConstants } from '../../../omnitrack/core/research/socket';


export default class OTExperimentCtrl {

  makeExperimentAndCorrespondingResearcherQuery(experimentId: string, researcherId: string): any{
    return { $and: [{ _id: experimentId }, { $or: [{ manager: researcherId }, { "experimenters.researcher": researcherId }] }] }
  }

  private _getExperiment(researcherId: string, experimentId: string): Promise<Document> {
    return OTExperiment.findOne(this.makeExperimentAndCorrespondingResearcherQuery(experimentId, researcherId))
      .populate({ path: "manager", select: "_id email alias" })
      .populate({ path: "experimenters.researcher", select: "_id email alias" })
      .then(doc => doc)
  }

  private _updateCollaboratorPermissions(experimentId: string, managerId: string, collaboratorId: string, permissions: ExperimentPermissions): Promise<boolean> {
    return OTExperiment.findOneAndUpdate({ _id: experimentId, "experimenter.researcher": collaboratorId, manager: managerId }, {
      $push: {
        "experimenters.0.permissions": permissions
      }
    }).then(
      experiment => {
        if (experiment) {
          app.socketModule().sendUpdateNotificationToExperimentSubscribers(experimentId, { model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_EDITED })
          app.socketModule().sendUpdateNotificationToResearcherSubscribers(collaboratorId, { model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_PERMISSION_CHANGED })

          return true
        }
        else return false
      }
      )
  }

  private _addCollaborator(experimentId: string, managerId: string, collaboratorId: string, permissions: ExperimentPermissions): Promise<boolean> {
    return OTExperiment.findOneAndUpdate({ _id: experimentId, manager: managerId }, {
      $push: {
        experimenters: { researcher: collaboratorId, permissions: permissions }
      }
    }).then(
      experiment => {
        if (experiment) {
          app.socketModule().sendUpdateNotificationToExperimentSubscribers(experimentId, { model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_EDITED })
          app.socketModule().sendUpdateNotificationToResearcherSubscribers(collaboratorId, { model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_INVITED })

          return true
        }
        else return false
      }
      )
  }

  private _restoreExperimentTrackingEntities(experimentId: string): Promise<boolean>{
    return Promise.all([OTTracker, OTTrigger].map(model => {
      return model.update({
        "flags.injected": true,
        "flags.experiment": experimentId
      }, { removed: false }, { multi: true }) })).then(
        result=>{
          console.log(result)
          return true
        }
      )
  }

  private _getPublicInvitations(userId: string): Promise<Array<any>>{
    return OTInvitation.find({isPublic: true})
      .populate({path: "experiment", select: "_id name", populate: {
        path: "participants",
        match: {user: userId}
      }})
      .then(docs => docs)
  }

  private _createExperimentByInfo(name: string, managerId: string): Promise<Document>{
    const newExperiment = new OTExperiment({name: name, manager: managerId})
    return newExperiment.save()
  }

  private _removeExperiment(experimentId: string, managerId: string): Promise<boolean>{
    return OTExperiment.findOneAndRemove({_id: experimentId, manager: managerId}).then(removed=>{
      if(removed){
        return Promise.all([OTTracker, OTTrigger].map(model=>{return model.update({"flags.injected": true,
        "flags.experiment": experimentId}, {removed: true}, {multi: true})})).then(result=>{
          console.log(result)
          return OTParticipant.find({experiment: experimentId}, {_id: 1, user: 1}).then(result=>{
            app.pushModule().sendDataMessageToUser(result.map(r=>{return r["user"]}), app.pushModule().makeFullSyncMessageData()).then(
              messageResult=>{
                console.log(messageResult)
              })

              return OTParticipant.remove({experiment: experimentId}).then(result=>{
                console.log(result)
                
                return OTInvitation.remove({experiment: experimentId}).then(result=>{
                  console.log(result)

                  //socket
                  app.socketModule().sendUpdateNotificationToExperimentSubscribers(experimentId, {model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_REMOVED})


                  return true
                })
              })
          })
        })
      }
      else return false
    })
  }

  getExperiment = (req, res) => {
    const researcherId = req.researcher.uid
    const experimentId = req.params.experimentId
    this._getExperiment(researcherId, experimentId).then(exp => {
      console.log(exp)
      res.status(200).json(exp)
    })
      .catch(err => {
        console.log(err)
        res.status(500).send(err)
      })
  }

  getManagerInfo = (req, res) => {
    const researcherId = req.researcher.uid
    const experimentId = req.params.experimentId
    this._getExperiment(researcherId, experimentId).then(exp => {
      if (exp != null) {
        if (exp["manager"]) {
          OTResearcher.findById(exp["manager"]).then(
            manager => {
              if (manager != null) {
                res.status(200).json(
                  {
                    uid: manager["_id"],
                    email: manager["email"],
                    alias: manager["alias"]
                  }
                )
              } else {
                res.sendStatus(404)
              }
            }
          )
        }
      }
    })
  }


  getExperimentInformationsOfResearcher = (req, res) => {
    const researcherId = req.researcher.uid
    console.log("find experiments of the researcher: " + researcherId)
    OTExperiment.find({ $or: [{ manager: researcherId }, { "experimenters.researcher": researcherId }] }, { _id: 1, name: 1, manager: 1, experimenters: 1 })
      .populate({ path: "manager", select: "_id email alias" })
      .then(experiments => {
        console.log(experiments)
        res.status(200).json(experiments)
      }).catch(err => {
        console.log(err)
        res.status(500).send(err)
      })
  }

  createExperiment = (req, res) => {
    const researcherId = req.researcher.uid
    if(researcherId)
    {
      if(req.body.name)
      {
        this._createExperimentByInfo(req.body.name, researcherId).then(experiment => {
          if(experiment){
            app.socketModule()
              .sendUpdateNotificationToResearcherSubscribers(researcherId, {model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_ADDED})
            
              res.status(200).send(experiment)
          }
          else{
            res.status(500).send({"error": "CannotCreated"})
          }
        }).catch(err=>{
          console.log(err)
          res.status(500).send(err)
        })
      }
    }
  }

  addCollaborator = (req, res) => {
    const managerId = req.researcher.uid
    const collaboratorId = req.body.collaborator
    const experimentId = req.params.experimentId
    const permissions = req.body.permissions
    if (!managerId || !collaboratorId || !experimentId || !permissions) {
      res.status(401).send({ error: "InvalidArguement" })
      return
    }

    this._addCollaborator(experimentId, managerId, collaboratorId, permissions).then(
      updated => {
        res.status(200).send(updated)
      }
    ).catch(err => {
      console.log(err)
      res.status(500).send({ error: err })
    })
  }


  updateCollaboratorPermissions = (req, res) => {
    const managerId = req.researcher.uid
    const collaboratorId = req.body.collaborator
    const experimentId = req.params.experimentId
    const permissions = req.body.permissions
    if (!managerId || !collaboratorId || !experimentId || !permissions) {
      res.status(401).send({ error: "InvalidArguement" })
      return
    }

    this._updateCollaboratorPermissions(experimentId, managerId, collaboratorId, permissions).then(
      updated => {
        res.status(200).send(updated)
      }
    ).catch(err => {
      console.log(err)
      res.status(500).send({ error: err })
    })
  }

  restoreExperimentTrackingEntities = (req, res) => {
    const experimentId = req.params.experimentId
    this._restoreExperimentTrackingEntities(experimentId).then(
      success=>{
        res.status(200).send(true)
      }
    )
  }

  updateExperiment=(req, res)=>{
    const managerId = req.researcher.uid
    const experimentId = req.params.experimentId
    OTExperiment.updateOne({_id: experimentId, manager: managerId}, req.body, {new: true}).then(
      updated => {
        if(updated){
          app.socketModule().sendUpdateNotificationToExperimentSubscribers(experimentId, {model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_EDITED})
          app.socketModule().sendUpdateNotificationToResearcherSubscribers(managerId, {model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_EDITED})
          if(updated["experimenters"])
          {
            updated["experimenters"].forEach(experimenter=>{
              app.socketModule().sendUpdateNotificationToResearcherSubscribers(experimenter.researcher, {model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_EDITED})
            })
          }

          res.status(200).send({updated: true, experiment: updated})
        }
        else{
          res.status(200).send({updated: false, experiment: updated})
        }
      }
    ).catch(err=>{
      console.log(err)
      res.status(500).send(err)
    })
  }

  removeExperiment = (req, res)=>{
    const managerId = req.researcher.uid
    const experimentId = req.params.experimentId
    this._removeExperiment(experimentId, managerId).then(success=>{
      if(success === true){
        res.status(200).send(success)
      }
      else{
        res.status(404).send(false)
      }
    }).catch(err=>{
      console.log(err)
      res.status(500).send(err)
    })
  }

  addExampleExperiment = (req, res) => {
    const managerId = req.researcher.uid
    const exampleKey = req.body.exampleKey
    if(exampleKey)
    {
      app.researchModule().generateExampleExperimentToResearcher(exampleKey, managerId, true).then(experimentId=>{
        res.status(200).send({experimentId: experimentId})
      })
      .catch(err=>{
        console.log(err)
        res.status(500).send(err)
      })
    }
    else{
      res.status(404).send("No example key was passed.")
    }
  }

  getExampleExperimentList = (req, res) => {
    console.log(app.researchModule().exampleExperimentInformations)
    res.status(200).send(app.researchModule().exampleExperimentInformations)
  }

  getPublicInvitationList = (req, res) => {
    const userId = res.locals.user.uid
    this._getPublicInvitations(userId).then(
      invitations=>{
        console.log(invitations)
        res.status(200).send(invitations)
      }
    ).catch(err=>{
      console.log(err)
      res.status(500).send(err)
    })
  }
}


const experimentCtrl = new OTExperimentCtrl()
export { experimentCtrl }