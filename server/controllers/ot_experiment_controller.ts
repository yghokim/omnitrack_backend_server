import OTResearcher from '../models/ot_researcher'
import OTExperiment from '../models/ot_experiment'
import { Document } from 'mongoose';


export default class OTExperimentCtrl {

  private _getExperiment(researcherId:string, experimentId: string): Promise<Document>{
    return OTExperiment.findOne({ $and: [ {_id: experimentId}, {$or: [{manager: researcherId}, {experimenters: researcherId}]} ] }).then(doc=>doc)
  }

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
    this._getExperiment(researcherId, experimentId).then(exp=>{
        console.log(exp)
        res.status(200).json(exp)
      })
      .catch(err=>{
        console.log(err)
        res.status(500).send(err)
      })
  }

  getManagerInfo = (req, res)=>{
    const researcherId = req.researcher.uid
    const experimentId = req.params.experimentId
    this._getExperiment(researcherId, experimentId).then(exp=>{
      if(exp!=null)
      {
        if(exp["manager"])
        {
          OTResearcher.findById(exp["manager"]).then(
            manager=>
            {
              if(manager!=null)
              {
                res.status(200).json(
                  {
                    uid: manager["_id"],
                    email: manager["email"],
                    alias: manager["alias"]
                  }
                )
              }
              else{
                res.sendStatus(404)
              }
            }
          )
        }
      }
    })
  }
}