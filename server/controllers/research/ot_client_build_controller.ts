import { IClientBuildConfigBase, AndroidBuildCredentials, IClientBuildAction } from '../../../omnitrack/core/research/db-entity-types';
import OTExperimentClientBuildConfigModel from '../../models/ot_experiment_client_build_config';
import OTClientBuildAction from '../../models/ot_client_build_action';
import { deepclone, isString, getExtensionFromPath } from '../../../shared_lib/utils';
import * as jsonHash from 'json-hash';
import { moveDir } from '../../server_utils';
import * as fs from 'fs-extra';
import * as multer from 'multer';
import * as unzip from 'extract-zip';
import * as path from 'path';
import { StorageEngine } from 'multer';
import { app } from '../../app';
import { spawn, exec } from 'child_process';
import appWrapper from '../../app';
import { ClientBuildStatus, EClientBuildStatus } from '../../../omnitrack/core/research/socket';
import C from '.././../server_consts';
import { ESPIPE } from 'constants';
import { config } from '../../../node_modules/rxjs';

export type BuildResultInfo = { sourceFolderPath: string, appBinaryPath: string, binaryFileName: string }

export default class OTClientBuildCtrl {

  private _makeExperimentConfigDirectoryPath(experimentId: string): string {
    return "storage/experiments/client_configs/" + experimentId
  }

  private _makeStorage(experimentId: string): StorageEngine {
    return multer.diskStorage({
      destination: (req, file, cb) => {
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

  _makeConfigHash(config: IClientBuildConfigBase<any>): string {
    const obj: IClientBuildConfigBase<any> = deepclone(config)
    delete obj.createdAt
    delete obj.updatedAt
    delete obj._id
    if (isString(obj.experiment) !== true && obj.experiment) {
      obj.experiment = (obj.experiment as any)._id
    }
    return jsonHash.digest(obj)
  }

  _makeClientBuildStatus(buildAction: IClientBuildAction): ClientBuildStatus {
    return {
      configId: isString(buildAction.config) === true ? buildAction.config : (buildAction.config as any)._id,
      platform: buildAction.platform,
      experimentId: isString(buildAction.experiment) === true ? buildAction.experiment : (buildAction.experiment as any)._id,
      status: buildAction.finishedAt == null ? EClientBuildStatus.BUILDING : buildAction.result,
      error: buildAction.result === EClientBuildStatus.FAILED ? buildAction.lastError : null
    } as ClientBuildStatus
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

  handleExperimentRemoval(experimentId: string): Promise<void> {
    const value = this._makeExperimentConfigDirectoryPath(experimentId)
    return fs.remove(value).then()
  }

  private prepareSourceCodeInFolder(config: IClientBuildConfigBase<any>): Promise<string> {
    //extract source code
    if (config.sourceCode) {
      return new Promise((resolve, reject) => {
        if (config.sourceCode.sourceType === 'file') {
          const configFileDir = this._makeExperimentConfigDirectoryPath(isString(config.experiment) === true ? config.experiment : (config.experiment as any)._id)
          const zipPath = path.join(configFileDir, "sourceCodeZip_" + config.platform + ".zip")
          fs.pathExists(zipPath, (err, exists) => {
            if (err) {
              reject(err);
            } else {
              if (exists === true) {
                const extractedPath = path.join(__dirname, "../../../../../", configFileDir, "source_" + config.platform)
                fs.remove(extractedPath).then(() => {
                  unzip(zipPath, { dir: extractedPath }, (err) => {
                    if (err) {
                      reject(err)
                    } else {
                      console.log(extractedPath)
                      fs.readdir(extractedPath).then(
                        (files) => {
                          console.log(files)
                          if (files.length === 1 && fs.statSync(path.join(extractedPath, files[0])).isDirectory() === true) {
                            console.log("single directory is in root.")
                            moveDir(path.join(extractedPath, files[0]), extractedPath).then(
                              () => {
                                resolve(extractedPath)
                              }).catch(err => {
                                reject(err)
                              })
                          } else {
                            resolve(extractedPath)
                          }
                        }
                      )
                    }
                  })
                })
              } else {
                reject(new Error("source code file does not exist."))
              }
            }
          })
        } else reject(new Error("We do not support other types for now."))
      })
    }
    else {
      return Promise.reject<string>("Source code is not designated")
    }
  }

  private _injectAndroidBuildConfigToSource(config: IClientBuildConfigBase<AndroidBuildCredentials>, sourceFolderPath: string): Promise<string> {
    const serverIP = app.get("publicIP")
    const port = 3000
    /*{
        "synchronizationServerUrl": null,
        "mediaStorageUrl": null,
        "defaultExperimentId": null,
        "overridePackageName": null,
        "overrideAppName": null,
        "disableExternalEntities": false,
        "disableTrackerCreation": false,
        "disableTriggerCreation": false,

        "signing": {
          "releaseKeystoreLocation": null,
          "releaseAlias": null,
          "releaseKeyPassword": null,
          "releaseStorePassword": null
        },
        "showTutorials": true,
        "hideServicesTab": false,
        "hideTriggersTab": false
      }
    */
    const experimentId = isString(config.experiment) === true ? config.experiment : (config.experiment as any)._id
    const sourceConfigJson = {
      synchronizationServerUrl: "http://" + serverIP + ":" + port,
      mediaStorageUrl: "http://" + serverIP + ":" + port,
      defaultExperimentId: experimentId
    } as any

    if (config.appName) sourceConfigJson.overrideAppName = config.appName
    if (config.packageName) sourceConfigJson.overridePackageName = config.packageName

    const keys = [
      'disableExternalEntities',
      'disableTrackerCreation',
      'disableTriggerCreation',
      'showTutorials',
      'hideServicesTab',
      'hideTriggersTab'
    ]

    keys.forEach(key => {
      if (config[key]) {
        sourceConfigJson[key] = config[key]
      }
    })

    sourceConfigJson.signing = {
      releaseKeystoreLocation: path.join("../../", "androidKeystore.jks"),
      "releaseAlias": config.credentials.keystoreAlias,
      "releaseKeyPassword": config.credentials.keystoreKeyPassword,
      "releaseStorePassword": config.credentials.keystorePassword
    }

    let keystorePropertiesString = ""
    if (config.apiKeys && config.apiKeys.length > 0) {
      keystorePropertiesString = config.apiKeys.map(k =>
        k.key + " = \"" + k.value + "\""
      ).join("\n")
    }

    return Promise.all(
      [
        fs.writeJson(path.join(sourceFolderPath, "omnitrackBuildConfig.json"), sourceConfigJson, { spaces: 2 }),
        fs.writeJson(path.join(sourceFolderPath, "google-services.json"), config.credentials.googleServices, { spaces: 2 }),
        fs.writeFile(path.join(sourceFolderPath, "keystore.properties"), keystorePropertiesString)
      ]
    ).then(res => {
      console.log("generated config files in the source folder.")
      return sourceFolderPath
    })
  }

  private _buildAndroidApk(sourceFolderPath: string): Promise<BuildResultInfo> {
    return new Promise((resolve, reject) => {
      console.log("start building the android app")
      const os = require('os')
      let arg0: string
      switch (os.type()) {
        case 'Linux':
        case 'Darwin':
          arg0 = './gradlew'
          break;
        case 'Windows_NT':
          arg0 = 'gradlew'
          break;
      }

      const command = spawn(arg0, ['assembleRelease', '--stacktrace'], { cwd: sourceFolderPath, shell: true })
      command.stdout.on('data', (data) => {
        console.log(data.toString())
      })
      let lastErrorString: string = null
      command.stderr.on('data', (data) => {
        lastErrorString = data.toString()
        console.log(lastErrorString)
      })
      command.on('exit', (code) => {
        if (code === 0) {
          const appBinaryFolorPath = path.join(sourceFolderPath, "app/build/outputs/apk/release/")
          const outputInfo = fs.readJsonSync(path.join(appBinaryFolorPath, "output.json"))
          const fileName = outputInfo.find(o => o.outputType.type === 'APK').path
          const appBinaryPath = path.join(appBinaryFolorPath, fileName)
          try {
            const stat = fs.statSync(appBinaryPath)
            resolve({ sourceFolderPath: sourceFolderPath, appBinaryPath: appBinaryPath, binaryFileName: fileName })
          } catch (err) {
            reject({ code: err.code, lastErrorMessage: lastErrorString })
          }
        }
        else {
          reject({ code: code, lastErrorMessage: lastErrorString })
        }
      })
    })
  }

  private _setupAndroidSource(sourceFolderPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log("start setup the android source")
      const os = require('os')
      let command
      switch (os.type()) {
        case 'Linux':
        case 'Darwin':
          command = spawn('sh', ['./setup_from_server.sh'], { cwd: sourceFolderPath })
          break;
        case 'Windows_NT':
          command = spawn('cmd.exe', ['/c', 'setup_from_server.bat'], { cwd: sourceFolderPath })
          break;
      }

      let lastErrorString: string = null

      command.stdout.on('data', (data) => {
        console.log("Stdout:::", data.toString())
      })
      command.stderr.on('data', (data) => {
        lastErrorString = data.toString()
        console.log("StdError:::", lastErrorString)
      })
      command.on('exit', (code) => {
        if (code === 0) {
          resolve(sourceFolderPath)
        }
        else {
          reject({ code: code, lastErrorMessage: lastErrorString })
        }
      })
    })
  }

  public buildAndroidApk(config: IClientBuildConfigBase<AndroidBuildCredentials>): Promise<BuildResultInfo> {
    return this.prepareSourceCodeInFolder(config)
      .then(sourcePath => this._setupAndroidSource(sourcePath))
      .then((sourcePath) => this._injectAndroidBuildConfigToSource(config, sourcePath))
      .then((sourcePath) => this._buildAndroidApk(sourcePath))
  }



  _build(configId: string, experimentId: string): Promise<BuildResultInfo> {
    return OTExperimentClientBuildConfigModel.findOne({
      _id: configId,
      experiment: experimentId
    }).lean().then(config => {
      switch (config.platform) {
        case "Android": return this.buildAndroidApk(config)
        default: throw new Error("Unsupported platform.")
      }
    })
    /*
    return OTExperimentClientBuildConfigModel.findOne({
      _id: configId,
      experiment: experimentId
    }).lean().then(config => {
      let buildPromise: Promise<BuildResultInfo>
      switch (config.platform) {
        case "Android": buildPromise = this.buildAndroidApk(config)
          break;
        default: throw new Error("Unsupported platform.")
      }

      return new OTClientBuildAction(this._makeClientBuildActionBase(experimentId, config)).save().then(
        savedAction => {
          console.log(savedAction)
          return buildPromise.then(buildResult => {
            savedAction["finishedAt"] = new Date()
            savedAction["result"] = EClientBuildStatus.SUCCEEDED
            //TODO handle client binary
            return buildResult
          }).catch(err => {
            savedAction["finishedAt"] = new Date()
            savedAction["result"] = EClientBuildStatus.FAILED
            savedAction["lastError"] = err
            return savedAction.save().then((savedAction) => {
              console.log(savedAction)
              return Promise.reject(err)
            })
          })
        }
      )
    })*/
  }

  _cancelBuild(configId: string): Promise<boolean> {
    return OTExperimentClientBuildConfigModel.findOne({ _id: configId }, "_id experiment platform").lean().then(
      old => {
        console.log(old)
        if (old != null) {
          return appWrapper.serverModule().cancelAllBuildJobsOfPlatform(old.experiment, old.platform).then(numCanceled => {
            return OTClientBuildAction.update({
              experiment: old.experiment,
              platform: old.platform,
              finishedAt: null
            }, {
                finishedAt: new Date(),
                result: 'canceled'
              }).then(res => {
                console.log(res)
                return true
              })
          })
        } else return false
      }
    )
  }

  _getOngoingBuildJobs(experimentId?: string): Promise<Array<ClientBuildStatus>> {
    const query: any = { finishedAt: null }
    if (experimentId) {
      query.experiment = experimentId
    }

    return OTClientBuildAction.find(query).lean().then(
      actions => {
        console.log(actions)
        return actions.map(a => this._makeClientBuildStatus(a))
      }
    )
  }

  _getLastCompleteBuildHistoryWithConfig(configId: string, configHash: string): Promise<IClientBuildAction> {
    return OTClientBuildAction.findOne({
      config: configId,
      configHash: configHash,
      finishedAt: { $exists: true }
    }, {}, { sort: { 'finishedAt': -1 } }).then(doc => doc as any)
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

  startBuild = (req, res) => {
    OTExperimentClientBuildConfigModel.findOne({ _id: req.body.configId }).lean().then(config => {
      if (config) {
        const hash = this._makeConfigHash(config)
        if (req.body.force === true) {
          return { config: config, hash: hash }
        } else {
          return this._getLastCompleteBuildHistoryWithConfig(config._id, hash)
            .then(buildAction => {
              if (buildAction) {
                if (buildAction.result === EClientBuildStatus.FAILED) {
                  throw {code:EClientBuildStatus.FAILED, message: "You have already been failed with the same configuration."}
                }
              }
              return { config: config, hash: hash }
            })
        }
      } else return null
    }).then(res => {
      if (res) {
        return appWrapper.serverModule().startClientBuildAsync(res.config._id, res.config.experiment, res.config.platform, res.hash)
      } else return null
    }).then(
      job => {
        if (job) {
          console.log("build job started. job id: " + job.attrs._id)
          res.status(200).send(true)
        } else {
          res.status(200).send(false)
        }
      }
    ).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }

  cancelBuild = (req, res) => {
    this._cancelBuild(req.body.configId).then(reallyCanceled => {
      res.status(200).send(reallyCanceled)
    }).catch(err => {
      console.error(err)
      res.status(500).send(err)
    })
  }

  getBuildStatus = (req, res) => {
    const experimentId = req.params.experimentId
    this._getOngoingBuildJobs(experimentId).then(
      statusList => {
        res.status(200).send(statusList)
      }
    ).catch(err => {
      res.status(500).send(err)
    })
  }
}

const clientBuildCtrl = new OTClientBuildCtrl()
export { clientBuildCtrl }