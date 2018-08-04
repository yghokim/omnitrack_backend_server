import OTUser from '../models/ot_user'
import OTResearcher from '../models/ot_researcher'
import OTExperiment from '../models/ot_experiment'
import OTParticipant from '../models/ot_participant'
import { IJoinedExperimentInfo } from '../../omnitrack/core/research/experiment'
import { Document } from 'mongoose';
import app from '../app';
import { SocketConstants } from '../../omnitrack/core/research/socket';
import { OTUsageLogCtrl } from './ot_usage_log_controller';

export default class OTResearchCtrl {

  getResearchers = (req, res) => {
    OTResearcher.find({}, { _id: 1, email: 1, alias: 1, account_approved: 1, createdAt: 1 }).lean().then(researchers => {
      res.status(200).send(researchers || [])
    }).catch(err => {
      console.log(err)
      res.status(200).send(err)
    })
  }

  setResearcherAccountApproved = (req, res) => {
    OTResearcher.findByIdAndUpdate(req.params.researcherId, { account_approved: req.body.approved }, { new: false }).then(original => {
      res.status(200).send(original["account_approved"] !== req.body.approved)
    }).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }

  searchResearchers = (req, res) => {
    const researcherId = req.researcher.uid
    const searchTerm = req.query.term
    const excludeSelf = (req.query.excludeSelf || "true") === "true"

    const searchQuery = {
      $or: [
        { email: { $regex: searchTerm, $options: 'gi' } },
        { alias: { $regex: searchTerm, $options: 'gi' } },
      ]
    }

    let condition
    if (excludeSelf === true) {
      condition = { $and: [{ _id: { $ne: researcherId } }, searchQuery] }
    } else { condition = searchQuery }

    console.log("search researchers with term " + searchTerm)

    return OTResearcher.find(condition, { _id: 1, email: 1, alias: 1 }, { multi: true }).lean().catch(err => {
      console.log(err)
      return []
    })
      .then(result => {
        console.log("search result: ")
        console.log(result)
        res.status(200).send(result)
      }).catch(err => {
        console.log(err)
        res.status(500).send(err)
      })

  }

  getExperimentHistoryOfUser = (req, res) => {
    let userId
    if (res.locals.user) {
      userId = res.locals.user.uid
    } else if (req.researcher) {
      userId = req.query.userId
    }

    const after = req.query.after || Number.MIN_VALUE

    OTParticipant.find({ "user": userId, isConsentApproved: true }).populate({
      path: "experiment",
      select: '_id name'
    }).lean().then(
      participants => {
        const list = participants.map(participant => {
          return {
            id: participant["experiment"]._id,
            name: participant["experiment"].name,
            experimentRangeStart: participant["experimentRange"].from ? participant["experimentRange"].from.getTime() : participant["approvedAt"].getTime(),
            joinedAt: participant["approvedAt"].getTime(),
            droppedAt: participant["dropped"] === true ? participant["droppedAt"].getTime() : null
          } as IJoinedExperimentInfo
        })

        res.status(200).send(
          list
        )
      }
    ).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }

  getallParticipants = (req, res) => {
    OTParticipant.find({}).populate("user").populate("invitation").populate("experiment").then(
      docs => {
        res.status(200).send(docs)
      }
    )
  }

  removeParticipant = (req, res) => {
    const participantId = req.params.participantId
    app.researchModule().removeParticipant(participantId).then(
      participant => {
        res.status(200).send(participant)
      }
    ).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }

  changeParticipantAlias = (req, res) => {
    const participantId = req.params.participantId
    const alias = req.body.alias
    app.researchModule().changeParticipantAlias(participantId, alias).then(
      changed => {
        res.status(200).send(changed)
      }
    ).catch(
      err => {
        res.status(500).send({ error: err })
      }
    )
  }

  updateParticipant = (req, res) => {
    const participantId = req.params.participantId
    const update = req.body.update
    OTParticipant.findByIdAndUpdate(participantId, update, { new: false }).then(
      updated => {
        if (updated) {
          app.socketModule().sendUpdateNotificationToExperimentSubscribers(updated["experiment"], { model: SocketConstants.MODEL_PARTICIPANT, event: SocketConstants.EVENT_EDITED })
          res.status(200).send(updated)
        } else {
          res.status(404).send("No such participant with id " + participantId)
        }
      }
    ).catch(err => {
      res.status(500).send(err)
    })
  }

  getUsersWithPariticipantInformation = (req, res) => {
    OTUser.find({}).populate({
      path: 'participantIdentities',
      select: '_id invitation dropped',
      populate: {
        path: 'invitation',
        select: '_id experiment code',
        populate: {
          path: 'experiment',
          select: '_id name'
        }
      }
    }).lean().then(list => {
      res.status(200).send(list)
    }).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }


  getExperimentConsentInfo = (req, res) => {
    const experimentId = req.params.experimentId || res.locals.experimentId
    OTExperiment.findOne({
      _id: experimentId
    }, {
        consent: 1,
        receiveConsentInApp: 1,
        demographicFormSchema: 1
      }).lean().then(
        exp => {
          if (exp) {
            res.status(200).send(exp)
          } else {
            res.status(404).send("No such experiment.")
          }
        }
      )
  }

  approveExperimentInvitation = (req, res) => {
    let userId: string
    if (req.researcher) {
      // researcher mode
      userId = req.body.userId
    } else if (res.locals.user) {
      // user mode
      userId = res.locals.user.uid
    } else {
      res.status(500).send("UnAuthorized from either side.")
    }

    const invitationCode = req.query.invitationCode
    if (!userId || !invitationCode) {
      res.status(500).send("IllegalArgumentException")
    } else {

      app.researchModule().handleInvitationApproval(userId, invitationCode)
        .then(result => {
          res.status(200).send(result)
        })
        .catch(error => {
          res.status(500).send(error)
        })
    }
  }

  dropOutFromExperiment = (req, res) => {
    let userId: string
    let participantId: string
    let researcherId: string = null
    if (req.researcher) {
      // researcher mode
      researcherId = req.researcher._id
      userId = req.body.userId
      participantId = req.params.participantId
    } else if (res.locals.user) {
      // user mode
      userId = res.locals.user.uid
    } else {
      res.status(500).send("UnAuthorized from either side.")
      return
    }

    const experimentId = req.params.experimentId

    const reason = req.body.reason

    let promise: Promise<any>

    if (participantId) {
      promise = app.researchModule().dropParticipant(participantId, reason, researcherId)
    } else if (userId && experimentId) {
      promise = app.researchModule().dropOutFromExperiment(userId, experimentId, reason, researcherId)
    }

    promise.then(result => {
      res.status(200).send(result)
    })
      .catch(err => {
        console.log("Dropout err:")
        console.log(err)
        res.status(500).send(err)
      })
  }

  sendNotificationMessageToUser = (req, res) => {
    const researcher = req.researcher
    const userId: string | string[] = req.body.userId
    const title: string = req.body.title
    const message: string = req.body.message
    const payload: any = req.body.payload
    payload.sent_by_name = researcher.email
    app.pushModule().sendNotificationMessageToUser(userId, title, message, payload).then(
      result => {
        res.status(200).send(result)
      }
    ).catch(err => {
      res.status(500).send(err)
    })
  }

  generateAliasOfParticipants = (req, res) => {
    app.researchModule().putAliasToParticipantsIfNull().then(
      count => {
        res.status(200).send({ count: count })
      }
    ).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }
}