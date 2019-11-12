import OTUser from "../../models/ot_user";
import app from '../../app';

export default class OTParticipantCtrl {

  setExcludedDays(participantId: string, dates: Array<Date>): Promise<{ success: boolean, error?: any, changedParticipant?: any }> {
    return OTUser.findByIdAndUpdate(participantId, { "participationInfo.excludedDays": dates }, { new: true }).lean<any>().then(
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
    OTUser.findById(participantId, {_id: 1, experiment: 1}).lean<any>().then(participant => {
      return app.pushModule().sendDataPayloadMessageToUser(participant._id, app.pushModule().makeFullSyncMessageData(experimentId).toMessagingPayloadJson())
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
