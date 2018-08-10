import { IClientBuildConfigBase, AndroidBuildCredentials } from '../../../omnitrack/core/research/db-entity-types';
import { OTExperimentClientBuildConfigModel } from '../../models/ot_experiment_client_build_config';
import { deepclone } from '../../../shared_lib/utils';


export default class OTClientBuildCtrl {

  _getClientBuildConfigsOfExperiment(experimentId: string): Promise<Array<IClientBuildConfigBase<any>>> {
    return OTExperimentClientBuildConfigModel.find({ experiment: experimentId })
      .lean().then(documents => {
        return documents.map(d => d)
      })
  }

  _initializeDefaultPlatformConfig(experimentId: string, platform: string): Promise<IClientBuildConfigBase<any>> {
    if (platform !== "Android") {
      throw "Unsupported platform."
    }

    const newModel = new OTExperimentClientBuildConfigModel({
      experiment: experimentId,
      platform: platform
    })

    switch (platform.toLowerCase()) {
      case "android":
        newModel["credentials"] = { 
          googleServices: null
        } as AndroidBuildCredentials
        break;
    }

    return newModel.save().then(doc => doc.toJSON())
  }

  initializeDefaultPlatformConfig = (req, res) => {
    const experimentId = req.params.experimentId
    const platform = req.body.platform
    this._initializeDefaultPlatformConfig(experimentId, platform).then(
      config => {
        res.status(200).send(config)
      }).catch(
        err => {
          res.status(500).send(err)
        })
  }

  getClientBuildConfigsOfExperiment = (req, res) => {
    const experimentId = req.params.experimentId
    this._getClientBuildConfigsOfExperiment(experimentId)
      .then(
        list => {
          res.status(200).send(list)
        }
      ).catch(err => {
        res.status(500).send(err)
      })
  }

  updateClientBuildConfigs = (req, res) => {
    const configId = req.body.config._id
    const update = deepclone(req.body.config)
    delete update._id
    OTExperimentClientBuildConfigModel.findOneAndUpdate(
      {
        _id: configId,
        experiment: req.params.experimentId
      },
      update,
      { new: true }
    ).lean().then(
      newDoc => {
        console.log(newDoc)
        res.status(200).send(newDoc)
      }
    ).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }
}

const clientBuildCtrl = new OTClientBuildCtrl()
export { clientBuildCtrl }