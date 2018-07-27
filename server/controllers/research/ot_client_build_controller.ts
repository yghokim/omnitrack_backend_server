import { IClientBuildConfigBase, AndroidBuildCredentials } from '../../../omnitrack/core/research/db-entity-types';
import OTExperimentClientBuildConfigModel from '../../models/ot_experiment_client_build_config';
import { deepclone, isString, getExtensionFromPath } from '../../../shared_lib/utils';
import * as fs from 'fs-extra';
import * as multer from 'multer';
import { StorageEngine } from 'multer';
import { app } from '../../app';

export default class OTClientBuildCtrl {

  private _makeExperimentConfigDirectoryPath(experimentId: string): string {
    return "storage/experiments/client_configs/" + experimentId
  }

  private _makeStorage(experimentId: string): StorageEngine {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        console.log(req)
        const dirPath = this._makeExperimentConfigDirectoryPath(experimentId)
        fs.ensureDir(dirPath).then(
          () => {
            cb(null, dirPath)
          }
        ).catch(err => {
          console.log(err)
          cb(err, null)
        })
      },
      filename: function (req, file, cb) {
        cb(null, file.fieldname + "." + getExtensionFromPath(file.originalname))
      }
    })
  }

  _getClientBuildConfigsOfExperiment(experimentId: string): Promise<Array<IClientBuildConfigBase<any>>> {
    return OTExperimentClientBuildConfigModel.find({ experiment: experimentId })
      .lean().then(documents => {
        return documents.map(d => d)
      })
  }

  _initializeDefaultPlatformConfig(experimentId: string, platform: string): Promise<IClientBuildConfigBase<any>> {
    if (platform !== "Android") {
      throw new Error("Unsupported platform.")
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

  handleExperimentRemoval(experimentId: string): Promise<void>{
    const value = this._makeExperimentConfigDirectoryPath(experimentId)
    return fs.remove(value).then()
  }

  _makeAndroidBuildConfigJson(config: IClientBuildConfigBase<AndroidBuildCredentials>): any {
    const serverIP = app.get("serverIP")
    const port = 3000
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

    const getForm = multer({ storage: this._makeStorage(req.params.experimentId) }).fields([
      { name: "config", maxCount: 1 },
      { name: "androidKeystore", maxCount: 1 },
      { name: "sourceCodeZip_Android", maxCount: 1 },
      { name: "sourceCodeZip_iOS", maxCount: 1 }
      
    ])

    getForm(req, res, err => {
      if (err) {
        console.log(err)
        res.status(500).send(err)
        return
      }

      const update = isString(req.body.config) === true ? JSON.parse(req.body.config) : deepclone(req.body.config)
      const configId = update._id
      delete update._id
      delete update.createdAt
      delete update.updatedAt

      OTExperimentClientBuildConfigModel.findOneAndUpdate(
        {
          _id: configId,
          experiment: req.params.experimentId
        },
        update,
        { new: true }
      ).lean().then(
        newDoc => {
          res.status(200).send(newDoc)
        }
      ).catch(updateError => {
        console.log(updateError)
        res.status(500).send(updateError)
      })
    })
  }
}

const clientBuildCtrl = new OTClientBuildCtrl()
export { clientBuildCtrl }