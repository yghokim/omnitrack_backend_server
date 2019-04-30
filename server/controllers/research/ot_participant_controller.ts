import { IParticipantDbEntity } from "../../../omnitrack/core/db-entity-types";
import OTParticipant from "../../models/ot_participant";
import app from '../../app';

export default class OTParticipantCtrl {

  setExcludedDays(participantId: string, dates: Array<Date>): Promise<{ success: boolean, error?: any, changedParticipant?: any }> {
    return OTParticipant.findByIdAndUpdate(participantId, { excludedDays: dates }, { new: true }).lean().then(
      changedParticipant => {
        if (changedParticipant) {
          return { success: true, changedParticipant: changedParticipant }
        } else { return { success: false, error: "NotFound" } }
      }
    ).catch(err => {
      return { success: false, error: err }
    })
  }

  postExcludedDays = (req, res) => {
    const participantId = req.params.participantId
    const dates = req.body.excludedDays
    this.setExcludedDays(participantId, dates).then(result => {
      res.status(200).send(result)
    }).catch(err => {
      res.status(500).send(err)
    })
  }

  sendSyncMessageToClients = (req, res) => {

    const participantId = req.params.participantId
    const experimentId = req.body.experimentId
    OTParticipant.findById(participantId, {user: 1, experiment: 1}).lean().then(participant => {
      return app.pushModule().sendDataPayloadMessageToUser(participant.user, app.pushModule().makeFullSyncMessageData(experimentId).toMessagingPayloadJson())
    }).then(
      result => {
        res.status(200).send(result)
      }
    ).catch(err=>{
      res.status(500).send(err)
    })
  }
}

export const participantCtrl = new OTParticipantCtrl()