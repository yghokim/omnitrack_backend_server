import OTResearcher from '../../models/ot_researcher'
import { SocketConstants } from '../../../omnitrack/core/research/socket';
import app from '../../app';
import C from '../../server_consts'
import * as path from "path";
import { ExampleExperimentInfo } from '../../../omnitrack/core/research/experiment';
import OTExperiment from '../../models/ot_experiment';

export default class OTResearchCtrl {

  readonly exampleExperimentInformations: Array<ExampleExperimentInfo> = [
    {
      key: "productivity_diary",
      name: "Diary Study for Personal Productivity",
      description: "Conduct a diary study by asking participants to log the information of their productive tasks"
    }
  ]

  generateExampleExperimentToResearcher(exampleKey: string, researcherId: string, notifySocket: boolean = false): Promise<string> {

    const info = this.exampleExperimentInformations.find(i => i.key === exampleKey)
    if (info) {

      const experiment = new OTExperiment({
        name: info.name,
        manager: researcherId
      } as any)

      switch (info.key) {
        case "productivity_diary":
          const trackingPackage = {
            name: "Diaries and Reminders",
            data: require(path.join(__dirname, "../../../../../omnitrack/examples/diary_study_template.json"))
          }
          experiment["trackingPlans"].push(trackingPackage)
          experiment["groups"][0].trackingPlanKey = experiment["trackingPlans"][0].key
          break;
      }

      return experiment.save().then(result => {

        if (notifySocket === true) {
          app.socketModule().sendUpdateNotificationToResearcherSubscribers(researcherId, { model: SocketConstants.MODEL_EXPERIMENT, event: SocketConstants.EVENT_ADDED })
        }

        return result._id
      })

    } else {
      return Promise.reject("no example key found.")
    }
  }

  addExampleExperiment = (req, res) => {
    const managerId = req.researcher.uid
    const exampleKey = req.body.exampleKey
    if (exampleKey) {
      this.generateExampleExperimentToResearcher(exampleKey, managerId, true).then(experimentId => {
        res.status(200).send({ experimentId: experimentId })
      })
        .catch(err => {
          console.log(err)
          res.status(500).send(err)
        })
    } else {
      res.status(404).send("No example key was passed.")
    }
  }

  getExampleExperimentList = (req, res) => {
    res.status(200).send(this.exampleExperimentInformations)
  }

  getResearchers = (req, res) => {
    OTResearcher.find({}, { _id: 1, email: 1, alias: 1, account_approved: 1, createdAt: 1 }).lean<any>().then(researchers => {
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

    return OTResearcher.find(condition, { _id: 1, email: 1, alias: 1 }, { multi: true }).lean<any>().catch(err => {
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
}
