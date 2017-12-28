import OTResearcher from '../models/ot_researcher'
import OTExperiment from '../models/ot_experiment'


export default class OTExperimentCtrl {
  getExperimentInformationsOfResearcher = (req, res)=>{
    const researcherId = req.researcher.uid
    console.log("find experiments of the researcher: " + researcherId)
    OTResearcher.findById(researcherId).then((researcher)=>{
      console.log("found researcher: " + researcher)
      OTExperiment.find({_id: {
        $in: (researcher as any).experiments
      }}).then(experiments=>{
        console.log(experiments)
        res.status(200).json(experiments)
      }).catch(err=>{
        console.log(err)
        res.status(500).send(err)
      })
    })
  }

  getExperiment = (req, res)=>{
    const researcherId = req.researcher.uid
    const experimentId = req.params.experimentId
    console.log("researcher Id: " + researcherId + ", experimentId: " + experimentId)
    OTExperiment.findOne({ $and: [ {_id: experimentId}, {$or: [{manager: researcherId}, {experimenters: researcherId}]} ] })
      .then(exp=>{
        console.log(exp)
        res.status(200).json(exp)
      })
      .catch(err=>{
        console.log(err)
        res.status(500).send(err)
      })
  }
}