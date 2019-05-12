import * as firebaseAdmin from "firebase-admin";
import { IClientBuildConfigBase, AndroidBuildCredentials, IClientBuildAction, IAndroidBuildConfig } from '../../../omnitrack/core/research/db-entity-types';
import OTClientBuildConfigModel from '../../models/ot_client_build_config';
import OTClientBuildAction from '../../models/ot_client_build_action';
import { deepclone, isString, getExtensionFromPath, parseProperties, compareVersions, extractVersion, deferPromise } from '../../../shared_lib/utils';
import { clientBinaryCtrl } from "./ot_client_binary_controller";
import * as jsonHash from 'json-hash';
import { checkFileExistenceAndType } from '../../server_utils';
import * as fs from 'fs-extra';
import * as multer from 'multer';
import * as unzip from 'extract-zip';
import * as path from 'path';
import { StorageEngine } from 'multer';
import { app, firebaseApp } from '../../app';
import { spawn } from 'child_process';
import appWrapper from '../../app';
import { ClientBuildStatus, EClientBuildStatus } from '../../../omnitrack/core/research/socket';
import * as deepEqual from 'deep-equal';
import * as randomstring from 'randomstring';
import env from '../../env';
import OTExperiment from '../../models/ot_experiment';

export interface BuildResultInfo { sourceFolderPath: string, appBinaryPath: string, binaryFileName: string }

export interface SourceFolderInfo {
  sourceType: string, // file | github
  data: any
}

export default class OTClientBuildCtrl {

  private getFirebaseManagement(): firebaseAdmin.projectManagement.ProjectManagement {
    return firebaseAdmin.projectManagement(firebaseApp)
  }

  private createNewFirebasePlatformApp(management: firebaseAdmin.projectManagement.ProjectManagement, platform: String, packageName: string, displayName: string): Promise<firebaseAdmin.projectManagement.AndroidApp | firebaseAdmin.projectManagement.IosApp> {
    switch (platform) {
      case "Android": return management.createAndroidApp(packageName, displayName)
      case "iOS": return management.createIosApp(packageName, displayName)
    }
  }

  private getFirebasePlatformAppList(management: firebaseAdmin.projectManagement.ProjectManagement, platform: String): Promise<Array<firebaseAdmin.projectManagement.AndroidApp> | Array<firebaseAdmin.projectManagement.IosApp>> {
    switch (platform) {
      case "Android": return management.listAndroidApps()
      case "iOS": return management.listIosApps()
    }
  }

  private getExperimentIdFromConfig(buildConfig: any): string {
    return buildConfig.researcherMode !== true ? (isString(buildConfig.experiment) === true ? buildConfig.experiment : (buildConfig.experiment as any)._id) : null
  }

  private _makeExperimentConfigDirectoryPath(experimentId: string, absolute: boolean = false): string {
    const rel = experimentId ? "storage/experiments/client_configs/" + experimentId : "storage/super/client_configs"
    if (absolute === true) {
      return path.join(__dirname, "../../../../../", rel)
    } else { return rel }
  }

  _makeClientCollectedLocation(experimentId: string, platform: string, absolute: boolean = false): string {
    return path.join(this._makeExperimentConfigDirectoryPath(experimentId, absolute), "client_binaries", platform)
  }

  private _makeStorage(experimentId: string): StorageEngine {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        const dirPath = this._makeExperimentConfigDirectoryPath(experimentId)
        console.log("ensure the directory", dirPath)
        fs.ensureDir(dirPath).then(
          () => {
            cb(null, dirPath)
          }
        ).catch(err => {
          console.error(err)
          cb(err, null)
        })
      },
      filename: function (req, file, cb) {
        cb(null, file.fieldname + "." + getExtensionFromPath(file.originalname))
      }
    })
  }

  _makeConfigHash(buildConfig: IClientBuildConfigBase<any>): string {
    const obj: IClientBuildConfigBase<any> = deepclone(buildConfig)
    delete obj.createdAt
    delete obj.updatedAt
    delete obj._id
    delete obj["__v"]
    if (isString(obj.experiment) !== true && obj.experiment) {
      obj.experiment = (obj.experiment as any)._id
    }
    return jsonHash.digest(obj)
  }

  _makeClientBuildStatus(buildAction: IClientBuildAction): ClientBuildStatus {
    return {
      configId: isString(buildAction.config) === true ? buildAction.config : (buildAction.config as any)._id,
      platform: buildAction.platform,
      researcherMode: buildAction.researcherMode,
      experimentId: this.getExperimentIdFromConfig(buildAction),
      status: buildAction.finishedAt == null ? EClientBuildStatus.BUILDING : buildAction.result,
      error: buildAction.result === EClientBuildStatus.FAILED ? buildAction.lastError : null
    } as ClientBuildStatus
  }

  _getClientBuildConfigs(experimentId: string): Promise<Array<IClientBuildConfigBase<any>>> {

    return OTClientBuildConfigModel.find(experimentId != null ? { experiment: experimentId } : { researcherMode: true })
      .lean().then(documents => {
        return documents.map(d => d)
      })
  }

  _generateJavaKeystoreFile(value: any): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const exec = require("child_process").exec;
      const keystoreDirectoryPath = path.join(__dirname, "../../../../../", "storage/temp/keystore/")

      fs.ensureDirSync(keystoreDirectoryPath)

      const keystorePath = keystoreDirectoryPath + "keystore_" + randomstring.generate(5) + ".jks"

      console.log("generate a keystore file at " + keystorePath)

      const dnames = {
        CN: value.name,
        OU: value.organizationalUnit,
        O: value.organization,
        L: value.city,
        S: value.province,
        C: value.countryCode
      }

      const command = 'keytool -genkeypair -keystore "' + keystorePath + '" -storetype jks -storePass ' + value.storePassword + ' -alias ' + value.alias + ' -keyPass ' + value.keyPassword + ' -keyalg RSA -keysize 4096 -sigalg SHA512withRSA' + ' -dname "' + Object.keys(dnames).map(key => {
        console.log(dnames[key])
        return key + "=" + (dnames[key] != null ? dnames[key] : 'Unknown')
      }).join(", ") + '"'

      console.log("generate keytool")
      console.log(command)
      exec(command, (err, stdout, stderr) => {
        if (err) {
          console.error(err)
          reject(err)
        } else {
          if (checkFileExistenceAndType(keystorePath)) {
            console.log(stdout)
            resolve(keystorePath)
          } else {
            console.error(stdout)
            console.error(stderr)
            reject(stderr)
          }
        }
      })
    })
  }

  _findFirebaseAppWithPackageName(platform: string, packageName: string, payloadAppId: string): Promise<firebaseAdmin.projectManagement.AndroidApp | firebaseAdmin.projectManagement.IosApp> {
    const management = this.getFirebaseManagement()
    return deferPromise(() => {
      if (payloadAppId != null) {
        console.log("Find a Firebase app with id: " + payloadAppId)
        switch (platform) {
          case "Android":
            const androidApp = management.androidApp(payloadAppId)
            if (androidApp != null) {
              console.log("got an android app. get metadata")
              return androidApp.getMetadata().then(metadata => metadata.packageName === packageName ? androidApp : null).catch(err => {
                console.error("Getting metadata error. Return null.")
                return null
              })
            } else return Promise.resolve(null)
          case "iOS":
            const iosApp = management.iosApp(payloadAppId)
            if (iosApp != null) {
              return iosApp.getMetadata().then(metadata => metadata.bundleId === packageName ? iosApp : null).catch(err => {
                console.error("Getting metadata error. Return null.")
                return null
              })
            } else return Promise.resolve(null)
          default: throw Error("Unsupported platform.")
        }
      }
      else return Promise.resolve(null)
    }).then(payloadedApp => {
      if (payloadedApp != null) {
        console.log("Found a firebase app.")
        return payloadedApp
      } else {
        console.log("Manually find a Firebase app.")
        return this.getFirebasePlatformAppList(management, platform).then(
          list => {
            if (list.length === 0) {
              return null
            } else {
              const checkAppRoutine = (app: any, index: number) => {
                return app.getMetadata().then(metadata => {
                  console.log("check ", metadata.displayName)
                  if (metadata.packageName === packageName || metadata.bundleId === packageName) {
                    console.log("found matching app with package name.")
                    return app
                  } else if (index + 1 < list.length) {
                    return checkAppRoutine(list[index + 1], index + 1)
                  } else return null
                })
              }

              return checkAppRoutine(list[0], 0)
            }
          }
        )
      }
    })
  }

  _generateOrLoadFirebaseApp(buildConfig: IClientBuildConfigBase<any>): Promise<firebaseAdmin.projectManagement.AndroidApp | firebaseAdmin.projectManagement.IosApp> {
    const fbManagement = this.getFirebaseManagement()
    const createNewApp = () => {
      return this.createNewFirebasePlatformApp(fbManagement, buildConfig.platform, buildConfig.packageName,
        buildConfig.researcherMode === true ? "OmniTrack Master" : ("exp:" + this.getExperimentIdFromConfig(buildConfig))
      ).then(
        createdApp => {
          buildConfig.firebasePlatformAppId = createdApp.appId
          console.log("created new FirebaseAndroidApp:")
          console.log(createdApp)
          return OTClientBuildConfigModel.findByIdAndUpdate(
            buildConfig._id,
            { firebasePlatformAppId: createdApp.appId }).then(doc => createdApp)
        }
      )
    }

    return this._findFirebaseAppWithPackageName(buildConfig.platform, buildConfig.packageName, buildConfig.firebasePlatformAppId)
      .then(platformApp => {
        if (platformApp != null) {
          if (platformApp.appId !== buildConfig.firebasePlatformAppId) {
            buildConfig.firebasePlatformAppId = platformApp.appId
            return OTClientBuildConfigModel.findByIdAndUpdate(
              buildConfig._id,
              { firebasePlatformAppId: platformApp.appId }).then(doc => platformApp)
          } else return platformApp
        }else{
          console.log("No Firebase app is registered with the package name \'" + buildConfig.packageName + "\'. Create new one.")
          return createNewApp()
        }
      })
  }

  _registerKeystoreFingerPrintToFirebase(firebaseAndroidApp: firebaseAdmin.projectManagement.AndroidApp, androidBuildConfig: IAndroidBuildConfig): Promise<firebaseAdmin.projectManagement.AndroidApp> {
    if (firebaseAndroidApp == null) {
      throw Error("parameter firebaseAndroidApp must not be null.")
    }

    if (androidBuildConfig == null) {
      throw Error("parameter androidBuildConfig must not be null.")
    }

    return this._validateAndGetSignatureFromJavaKeystore(androidBuildConfig._id, androidBuildConfig)
      .then(fingerprint => {
        const fingerprintFormatted = fingerprint.replace(/:/g, "").toLowerCase()
        console.log("check fingerprint ", fingerprintFormatted)
        return firebaseAndroidApp.getShaCertificates().then(certificates => {
          if (certificates.find(c => c.shaHash == fingerprintFormatted) != null) {
            console.log("SHA fingerprint is already registered in Firebase.")
            return firebaseAndroidApp
          } else {
            console.log("SHA fingerprint is not registered in Firebase. Add new.")
            return firebaseAndroidApp.addShaCertificate(
              this.getFirebaseManagement().shaCertificate(fingerprintFormatted)
            ).then(() => {
              console.log("completed adding SHA fingerprint.")
              return this.getFirebaseManagement().androidApp(firebaseAndroidApp.appId)
            })
          }
        })
      })
  }

  _validateAndGetSignatureFromJavaKeystore(configId: string, payloadBuildConfig?: IAndroidBuildConfig): Promise<string> {
    return deferPromise(() => {
      if (payloadBuildConfig) {
        return Promise.resolve(payloadBuildConfig)
      } else {
        return OTClientBuildConfigModel.findById(configId).select({ _id: 1, credentials: 1, experiment: 1, researcherMode: 1 }).lean().then(doc => doc as IAndroidBuildConfig)
      }
    }).then(buildConfig => {
      const keystoreFileLocation = path.join(this._makeExperimentConfigDirectoryPath(this.getExperimentIdFromConfig(buildConfig), true), "androidKeystore.jks")
      console.log("check keystore file in ", keystoreFileLocation)
      const fileExists = checkFileExistenceAndType(keystoreFileLocation) != null
      const keystorePasswordExists = buildConfig.credentials.keystorePassword != null
      const keystoreKeyPasswordExists = buildConfig.credentials.keystoreKeyPassword != null
      const keystoreAliasExists = buildConfig.credentials.keystoreAlias != null
      if (fileExists === false || keystorePasswordExists === false || keystoreKeyPasswordExists === false || keystoreAliasExists === false) {
        return Promise.reject({
          code: "IncompleteKeystoreInformation",
          message: "Please complete all the fields for keystore.",
          existence: {
            keystoreFile: fileExists,
            keystorePassword: keystorePasswordExists,
            keystoreKeyPassword: keystoreKeyPasswordExists,
            keystoreAlias: keystoreAliasExists
          }
        })
      }
      else {
        return new Promise<string>((resolve, reject) => {
          const exec = require("child_process").exec;
          exec('keytool -list -v -keystore "' + keystoreFileLocation + '" -storepass ' + buildConfig.credentials.keystorePassword + " -alias " + buildConfig.credentials.keystoreAlias, (err, stdout, stderr) => {
            if (err) {
              console.error(err);
              reject({
                code: "KeystoreError", message: "Wrong keytool information. Check your alias and passwords."
              })
            } else {
              const regex = /\s([0-9A-F]{2}(:[0-9A-F]{2}){19})\s/g
              const matches = regex.exec(stdout)
              if (matches && matches.length > 1) {
                resolve(matches[1].trim())
              } else {
                console.error(stderr)
                reject({ code: "KeystoreError", message: "Wrong keytool information. Check your alias and passwords." })
              }
            }
          });
        })
      }
    }).catch(err => {
      if (payloadBuildConfig != null) {
        payloadBuildConfig.credentials.keystoreValidated = false
      }
      return OTClientBuildConfigModel.findByIdAndUpdate(configId, {
        "credentials.keystoreValidated": false
      }, { upsert: false }).lean().then(res => {
        throw err
      })
    }).then(signature => {
      if (payloadBuildConfig != null) {
        payloadBuildConfig.credentials.keystoreValidated = true
      }
      return OTClientBuildConfigModel.findByIdAndUpdate(configId, {
        "credentials.keystoreValidated": true
      }, { upsert: false }).lean().then(res => signature)
    })


  }

  _initializeDefaultPlatformConfig(platform: string, researcherEmail: string, experimentId?: string, ): Promise<IClientBuildConfigBase<any>> {
    if (platform !== "Android") {
      throw new Error("Unsupported platform.")
    }

    const prefix = "io.github.omnitrack."

    return deferPromise(() => {
      if (experimentId) {
        return OTExperiment.findById(experimentId).select({
          name: 1,
          manager: 1
        }).populate("manager", { email: 1 }).lean().then(doc => {
          const expName = doc.name
          const managerEmail = doc.manager.email
          const emailParts = managerEmail.split('@')
          const snakeCase = require('snake-case');
          return prefix + snakeCase(emailParts[0]) + "." + snakeCase(expName)
        })
      } else {
        const emailParts = researcherEmail.split('@')
        const snakeCase = require('snake-case');
        return Promise.resolve("io.github.omnitrack." + snakeCase(emailParts[0]))
      }
    }).then(
      (fallbackPackageName) => {

        const newModel = new OTClientBuildConfigModel({
          packageName: fallbackPackageName,
          experiment: experimentId,
          researcherMode: experimentId != null ? false : true,
          platform: platform
        })

        console.log(newModel.toJSON())

        if (experimentId != null) {
          //experiment mode
          newModel["disableExternalEntities"] = true
        }
        else {
          //researcher mode
          newModel["disableExternalEntities"] = false
        }

        switch (platform.toLowerCase()) {
          case "android":
            newModel["credentials"] = {} as AndroidBuildCredentials
            break;
        }

        return deferPromise(() => {
          if (experimentId != null) {
            //get the master config's api keys
            return OTClientBuildConfigModel.findOne({
              experiment: null,
              platform: platform,
              researcherMode: true
            }, { apiKeys: 1 }).lean().then(masterConfig => {
              if (masterConfig != null) {
                newModel["apiKeys"] = masterConfig.apiKeys
              }
              return null
            })
          } else return Promise.resolve()
        }).then(() => newModel.save().then(doc => doc.toJSON()))
      }
    )
  }

  handleExperimentRemoval(experimentId: string): Promise<void> {
    return Promise.all([
      OTClientBuildConfigModel.aggregate([
        {
          $group: {
            _id: { packageName: "$packageName", platform: "$platform" },
            configs: { $push: "$$ROOT" }
          }
        },
        {
          $match: { "configs.experiment": experimentId, "configs": { $size: 1 } }
        }
      ]).then(list => {
        if (list.length > 0) {
          //TODO: remove Firebase platform apps if remove API is added in the future.
          return null
        } else {
          return null
        }
      }),
      fs.remove(this._makeExperimentConfigDirectoryPath(experimentId))]).then(res => null)
  }

  private findAndroidSourceRoot(extractedPath: string, buildConfig: IAndroidBuildConfig): string {
    const searchDirectory = (directoryPath: string) => {
      const fileNames = fs.readdirSync(directoryPath)

      // TODO separate other platforms.
      if (buildConfig.platform === 'Android' && fileNames.indexOf('gradlew') !== -1 && fileNames.indexOf('settings.gradle') !== -1) {
        // found the root directory.
        return directoryPath
      } else {
        const firstDir = fileNames.filter(f => fs.statSync(path.join(directoryPath, f)).isDirectory() === true).find(f => searchDirectory(path.join(directoryPath, f)) !== null)
        if (firstDir != null) {
          return path.join(directoryPath, firstDir)
        } else { return null }
      }
    }

    const rootPath = searchDirectory(extractedPath)
    return rootPath
  }

  private prepareSourceCodeInFolder(buildConfig: IClientBuildConfigBase<any>): Promise<{ sourceFolderPath: string, skipSetup: boolean }> {
    // extract source code
    if (buildConfig.sourceCode) {
      return new Promise((resolve, reject) => {
        const experimentId = this.getExperimentIdFromConfig(buildConfig)
        const configFileDir = this._makeExperimentConfigDirectoryPath(experimentId, false)
        if (buildConfig.sourceCode.sourceType === 'file') {
          const zipPath = path.join(configFileDir, "sourceCodeZip_" + buildConfig.platform + ".zip")
          fs.pathExists(zipPath, (err, exists) => {
            if (err) {
              reject(err);
            } else {
              if (exists === true) {
                const extractedPath = path.join(this._makeExperimentConfigDirectoryPath(experimentId, true), "source_" + buildConfig.platform)
                const sourceInfoPath = path.join(extractedPath, 'source_info.json')
                if (checkFileExistenceAndType(sourceInfoPath) != null) {
                  const sourceInfo = fs.readJsonSync(sourceInfoPath)
                  if (deepEqual(sourceInfo.info, buildConfig.sourceCode) === true) {
                    resolve({ sourceFolderPath: sourceInfo.projectRoot, skipSetup: true })
                    return
                  }
                }

                fs.remove(extractedPath).then(() => {
                  unzip(zipPath, { dir: extractedPath }, (unzipError) => {
                    if (unzipError) {
                      reject(unzipError)
                    } else {
                      console.log("find the exact project root folder in [", extractedPath, "]...")
                      // Find the exact root folder recursively////////////////////////////////////////////////////////////////////////////////////////////////////
                      const rootPath = this.findAndroidSourceRoot(extractedPath, buildConfig)
                      if (rootPath != null) {
                        fs.writeJsonSync(path.join(extractedPath, "source_info.json"), {
                          info: buildConfig.sourceCode,
                          projectRoot: rootPath
                        }, { spaces: 2 })
                        resolve({ sourceFolderPath: rootPath, skipSetup: false })
                      } else { reject(new Error("Not containing a valid project root.")) }
                      ///////////////////////////////////////////////////////////////////////////////////////////////////////
                    }
                  })
                })
              } else {
                reject(new Error("source code file does not exist."))
              }
            }
          })
        } else if (buildConfig.sourceCode.sourceType === 'github') {

          if (buildConfig.sourceCode.data) {
            let repo: string
            if (buildConfig.sourceCode.data.useOfficial === true) {
              // TODO platform repositories for useOfficial
              switch (buildConfig.platform) {
                case 'Android':
                  repo = "muclipse/omnitrack_android"
                  break;
              }
            } else {
              repo = buildConfig.sourceCode.data.repository
            }

            console.log("start download github archive. - ", repo)

            const repoTargetPath = path.join(this._makeExperimentConfigDirectoryPath(experimentId, true), "source_" + buildConfig.platform)
            try { fs.removeSync(repoTargetPath) } catch (err) { }
            const downloadGit = require('download-git-repo')
            downloadGit("github:" + repo + (buildConfig.sourceCode.data.branch ? ("#" + buildConfig.sourceCode.data.branch) : ""), repoTargetPath, (err) => {
              if (err) {
                console.error(err)
                reject(err)
              } else {
                console.log("successfully downloaded the github repository.");
                const rootPath = this.findAndroidSourceRoot(repoTargetPath, buildConfig)
                if (rootPath != null) {
                  fs.writeJsonSync(path.join(repoTargetPath, "source_info.json"), {
                    info: buildConfig.sourceCode,
                    projectRoot: rootPath
                  }, { spaces: 2 })
                  resolve({ sourceFolderPath: rootPath, skipSetup: false })
                } else { reject(new Error("Not containing a valid project root.")) }
              }
            })
          } else {
            reject(new Error("did not provide data on github repo."))
          }
        } else {
          reject(new Error("We do not support other types for now."))
        }
      })
    } else {
      return Promise.reject<any>("Source code is not designated")
    }
  }

  private _injectAndroidBuildConfigToSource(buildConfig: IClientBuildConfigBase<AndroidBuildCredentials>, sourceFolderPath: string): Promise<string> {
    const versionPropPath = path.join(sourceFolderPath, "version.properties")
    return Promise.all([
      fs.readFile(versionPropPath, 'utf8').then(propString => parseProperties(propString)),
      clientBinaryCtrl._getLatestVersionInfoForExperiment(this.getExperimentIdFromConfig(buildConfig), buildConfig.platform)
    ]).then(
      result => {
        const versionProperties = result[0]
        const latestVersionInfo = result[1]

        const appVersionCode: number = versionProperties.versionCode
        const appVersionName: string = versionProperties.versionName

        let newVersionCode: number = null
        let newVersionName: string = null

        if (latestVersionInfo) {
          console.log("The last deployed version name:", latestVersionInfo.versionName, " | current source code version name:", appVersionName)
          if (compareVersions(latestVersionInfo.versionName, appVersionName) >= 0) {
            // if latestVersion is higher or equal than this
            const v = extractVersion(latestVersionInfo.versionName)
            v.numbers[v.numbers.length - 1]++
            v.numbers[v.numbers.length - 2]++
            newVersionName = v.numbers.join(".") + "-" + v.suffix
            console.log("override to latest version name:", newVersionName)
          } else { newVersionName = appVersionName }

          if (appVersionCode <= latestVersionInfo.versionCode) {
            newVersionCode = latestVersionInfo.versionCode + 1
            console.log("override to latest version code:", newVersionCode)
          } else { newVersionCode = appVersionCode }
        } else {
          newVersionCode = appVersionCode
          newVersionName = appVersionName
        }

        return { versionName: newVersionName, versionCode: newVersionCode }
      }
    ).then(versionInfo => {

      const serverIP = env.force_private_ip === true ? app.get("privateIP") : app.get("publicIP")
      const port = 3000
      const experimentId = this.getExperimentIdFromConfig(buildConfig)
      const sourceConfigJson = {
        synchronizationServerUrl: "http://" + serverIP + ":" + port,
        mediaStorageUrl: "http://" + serverIP + ":" + port,
        defaultExperimentId: experimentId,
        overrideVersionName: versionInfo.versionName,
        overrideVersionCode: versionInfo.versionCode
      } as any

      if (buildConfig.appName) { sourceConfigJson.overrideAppName = buildConfig.appName }
      if (buildConfig.packageName) { sourceConfigJson.overridePackageName = buildConfig.packageName }

      const keys = [
        'disableExternalEntities',
        'disableTrackerCreation',
        'disableTriggerCreation',
        'showTutorials',
        'hideServicesTab',
        'hideTriggersTab'
      ]

      keys.forEach(key => {
        if (buildConfig[key] != null) {
          sourceConfigJson[key] = buildConfig[key]
        }
      })

      sourceConfigJson.signing = {
        // releaseKeystoreLocation: "$rootDir/" + path.join(path.relative(sourceFolderPath, this._makeExperimentConfigDirectoryPath(experimentId, true)), "androidKeystore.jks") + "\"",
        "releaseKeystoreLocation": path.join(this._makeExperimentConfigDirectoryPath(experimentId, true), "androidKeystore.jks"),
        "releaseAlias": buildConfig.credentials.keystoreAlias,
        "releaseKeyPassword": buildConfig.credentials.keystoreKeyPassword,
        "releaseStorePassword": buildConfig.credentials.keystorePassword
      }

      sourceConfigJson.enableDynamicApiKeyModification = buildConfig.researcherMode

      let keystorePropertiesString = ""
      if (buildConfig.apiKeys && buildConfig.apiKeys.length > 0) {
        keystorePropertiesString = buildConfig.apiKeys.map(k =>
          k.key + " = \"" + k.value + "\""
        ).join("\n")
      }

      console.log("write configuration files for Android build.")
      return Promise.all(
        [
          fs.writeJson(path.join(sourceFolderPath, "omnitrackBuildConfig.json"), sourceConfigJson, {
            spaces: 2
          }),
          this.getFirebaseManagement().androidApp(buildConfig.firebasePlatformAppId).getConfig()
            .catch(ex => {
              console.log("getConfig error.")
              return this.getFirebaseManagement().androidApp(buildConfig.firebasePlatformAppId).getConfig()
            })
            .then(googleServicesString => fs.writeFile(path.join(sourceFolderPath, "google-services.json"), googleServicesString)),
          fs.writeFile(path.join(sourceFolderPath, "keystore.properties"), keystorePropertiesString),
          // fs.writeFile(path.join(sourceFolderPath, "gradle.properties"), "android.enableAapt2=false")
        ]
      ).then(res => {
        console.log("generated config files in the source folder.")
        return sourceFolderPath
      })
    })
  }

  private _buildAndroidApk(sourceFolderPath: string, onNewProcessSpawn: (number) => Promise<void>, checkCanceled: () => Promise<boolean>): Promise<BuildResultInfo> {
    return new Promise((resolve, reject) => {
      console.log("start building the android app")
      const os = require('os')
      let arg0: string
      let arg1: Array<string>

      const buildArgs = ['assembleMinApi19Release', '--stacktrace', '--no-daemon', "-Dorg.gradle.jvmargs=-Xmx1280M -XX:MaxPermSize=256M"]

      switch (os.type()) {
        case 'Linux':
        case 'Darwin':
          arg0 = './gradlew'
          arg1 = buildArgs
          break;
        case 'Windows_NT':
          arg0 = 'cmd',
            arg1 = ["/c", "gradlew.bat"].concat(buildArgs)
          break;
      }

      const command = spawn(arg0, arg1, { cwd: sourceFolderPath, env: process.env, stdio: ['ignore', process.stdout, 'pipe'] })
      console.log("started the Android build process. PID:", command.pid)
      checkCanceled().then(canceled => {
        if (canceled === true) {
          const kill = require('tree-kill');
          kill(command.pid)
          reject(new Error("BuildCanceledExternally"))
        } else {
          onNewProcessSpawn(command.pid).then(
            () => {
              let lastErrorString: string = null
              command.stderr.on('data', (data) => {
                lastErrorString = data.toString()
                console.error(lastErrorString)
              })
              command.on('exit', (code) => {
                if (code === 0) {
                  const appBinaryFolorPath = path.join(sourceFolderPath, "app/build/outputs/apk/minApi19/release/")
                  const outputInfo = fs.readJsonSync(path.join(appBinaryFolorPath, "output.json"))
                  const fileName = outputInfo.find(o => o.outputType.type === 'APK').path
                  const appBinaryPath = path.join(appBinaryFolorPath, fileName)
                  try {
                    const stat = fs.statSync(appBinaryPath)
                    resolve({ sourceFolderPath: sourceFolderPath, appBinaryPath: appBinaryPath, binaryFileName: fileName })
                  } catch (err) {
                    reject({ code: err.code, lastErrorMessage: lastErrorString })
                  }
                } else {
                  reject({ code: code, lastErrorMessage: lastErrorString })
                }
              })
            }
          ).catch(pidUpdateErr => {
            console.error(pidUpdateErr)
            reject({ code: "PIDUpdateFailed", error: pidUpdateErr })
          })
        }
      })
    })
  }

  //Prepare source code in local storage with proper config files being processed, ready to build.
  _prepareSourceCode(configId: string): Promise<{ buildConfig: IClientBuildConfigBase<any>, sourceFolderPath: string }> {
    return OTClientBuildConfigModel.findOne({
      _id: configId
    }).lean().then(buildConfig =>
      this.prepareSourceCodeInFolder(buildConfig)
        .then(result => {
          // Platform-dependent logics=======================================================
          switch (buildConfig.platform) {
            case "Android":
              return this._generateOrLoadFirebaseApp(buildConfig)
                .then(firebaseAndroidApp => this._registerKeystoreFingerPrintToFirebase(firebaseAndroidApp as firebaseAdmin.projectManagement.AndroidApp, buildConfig))
                .then(firebaseAndroidApp => this._injectAndroidBuildConfigToSource(buildConfig, result.sourceFolderPath))
                .then(sourceFolderPath => ({ sourceFolderPath: sourceFolderPath, buildConfig: buildConfig }))
          }
        })
    )
  }

  _build(configId: string, experimentId: string, onNewProcessSpawn: (number) => Promise<void>, checkCanceled: () => Promise<boolean>): Promise<BuildResultInfo> {

    return this._prepareSourceCode(configId).then(
      result => {
        return checkCanceled().then(canceled => {
          if (canceled === true) {
            throw new Error("BuildCanceledExternally")
          } else {
            return result
          }
        })
      }
    ).then(sourceCodeProcessResult => {
      const buildConfig = sourceCodeProcessResult.buildConfig
      const sourceFolderPath = sourceCodeProcessResult.sourceFolderPath

      //An OS-Dependent Build Logic========================================================
      var buildCommand: Promise<BuildResultInfo>
      switch (buildConfig.platform) {
        case "Android":
          buildCommand = this._buildAndroidApk(sourceFolderPath, onNewProcessSpawn, checkCanceled)
          break;
        default: throw new Error("Unsupported platform.")
      }
      //=========================================================

      return buildCommand.then(buildResult => {
        return checkCanceled().then(canceled => {
          if (canceled === true) {
            throw new Error("BuildCanceledExternally")
          } else {
            return buildResult
          }
        })
      }).then(buildResult => {
        console.log("successfully built app. register binary to publish list.")
        // move client to temp folder
        const newLocation = this._makeClientCollectedLocation(experimentId, buildConfig.platform)
        return fs.ensureDir(newLocation).then(() => {
          const ext = getExtensionFromPath(buildResult.binaryFileName)
          const newName = path.basename(buildResult.appBinaryPath, "." + ext) + "_" + this._makeConfigHash(buildConfig) + "_" + randomstring.generate(5) + "." + ext
          const newFullPath = path.join(newLocation, newName)
          return fs.move(buildResult.appBinaryPath, newFullPath, { overwrite: true }).then(
            () => {
              buildResult.appBinaryPath = newFullPath
              buildResult.binaryFileName = newName
              return buildResult
            }
          ).catch(err => {
            console.error(err)
            throw err
          })
        })
      })
        .then(result => clientBinaryCtrl._registerNewClientBinary(result.appBinaryPath, [], null, null, this.getExperimentIdFromConfig(buildConfig.experiment)).then(() => {
          console.log("Client build process was finished successfully.")
          return result
        })).catch(err => {
          console.error(err)
          throw err
        })
    })
  }

  _cancelBuild(configId: string): Promise<boolean> {
    return OTClientBuildConfigModel.findOne({ _id: configId }, "_id experiment researcherMode platform").lean().then(
      old => {
        if (old != null) {
          return appWrapper.serverModule().cancelAllBuildJobsOfPlatform(old.experiment, old.platform).then(numCanceled => {
            return numCanceled > 0
          })
        } else { return false }
      }
    )
  }

  _getOngoingBuildJobs(experimentId?: string): Promise<Array<ClientBuildStatus>> {
    const query: any = { finishedAt: null }
    if (experimentId) {
      query.experiment = experimentId
    } else {
      query.researcherMode = true
    }

    return OTClientBuildAction.find(query).lean().then(
      actions => {
        return actions.map(a => this._makeClientBuildStatus(a))
      }
    )
  }

  _getLastCompleteBuildHistoryWithConfig(configId: string, configHash: string): Promise<IClientBuildAction> {
    return OTClientBuildAction.findOne({
      config: configId,
      configHash: configHash,
      finishedAt: { $ne: null }
    }, {}, { sort: { 'finishedAt': -1 } }).then(doc => doc as any)
  }

  initializeDefaultPlatformConfig = (req, res) => {
    const experimentId = req.body.experimentId
    const platform = req.body.platform
    console.log("initialize " + platform + " build config for " + experimentId)
    this._initializeDefaultPlatformConfig(platform, req.researcher.email, experimentId).then(
      buildConfig => {
        res.status(200).send(buildConfig)
      }).catch(
        err => {
          console.error(err)
          res.status(500).send(err)
        })
  }

  getClientBuildConfigs = (req, res) => {
    const experimentId = req.params.experimentId
    this._getClientBuildConfigs(experimentId)
      .then(
        list => {
          res.status(200).send(list)
        }
      ).catch(err => {
        console.error(err)
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
        console.error(err)
        res.status(500).send(err)
        return
      }

      if (req.body.config) {
        const update = isString(req.body.config) === true ? JSON.parse(req.body.config) : deepclone(req.body.config)

        const configId = update._id
        delete update._id
        delete update.createdAt
        delete update.updatedAt

        OTClientBuildConfigModel.findOneAndUpdate(
          {
            _id: configId
          },
          update,
          { new: true }
        ).lean().then(
          newDoc => {
            res.status(200).send(newDoc)
          }
        ).catch(updateError => {
          console.error(updateError)
          res.status(500).send(updateError)
        })
      } else {
        res.status(200).send
      }
    })
  }

  startBuild = (req, res) => {
    OTClientBuildConfigModel.findOne({ _id: req.body.configId }).lean().then(buildConfig => {
      if (buildConfig) {
        const hash = this._makeConfigHash(buildConfig)
        if (req.body.force === true) {
          return { config: buildConfig, hash: hash }
        } else {
          return this._getLastCompleteBuildHistoryWithConfig(buildConfig._id, hash)
            .then(buildAction => {
              if (buildAction) {
                if (buildAction.result === EClientBuildStatus.FAILED) {
                  throw { code: EClientBuildStatus.FAILED, message: "You have already failed with the same configuration." }
                }
              }
              return { config: buildConfig, hash: hash }
            })
        }
      } else { return null }
    }).then(result => {
      if (result) {
        return appWrapper.serverModule().startClientBuildAsync(result.config._id, result.config.experiment, result.config.platform, result.hash)
      } else { return null }
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
      console.error(err)
      res.status(500).send(err)
    })
  }

  downloadBuildableSourceCode = (req, res) => {
    return this._prepareSourceCode(req.body.configId).then(
      result => {
        const zipper = require('bestzip')

        const zipFilePath = result.sourceFolderPath + ".zip"

        zipper({
          source: "./",
          destination: "../" + path.basename(result.sourceFolderPath) + ".zip",
          cwd: result.sourceFolderPath
        }).then(() => {
          console.log('all done!');
          res.download(zipFilePath, 'omnitrack_build_source.zip', (err) => {
            if (err) {
              console.error("client build source file send error")
              console.error(err)
            } else {
              console.log("successfully sent a client build source zip.")
            }
            fs.removeSync(zipFilePath)
          })
        }).catch(function(err) {
          console.error(err.stack);
        });
      }
    )
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
    const experimentId = req.query.experimentId
    this._getOngoingBuildJobs(experimentId).then(
      statusList => {
        res.status(200).send(statusList)
      }
    ).catch(err => {
      console.error(err)
      res.status(500).send(err)
    })
  }

  validateAndGetSignatureFromJavaKeystore = (req, res) => {
    this._validateAndGetSignatureFromJavaKeystore(req.params.configId).then(signature => {
      res.status(200).send(signature)
    }).catch(e => {
      console.error(e)
      res.status(500).send(e)
    })
  }

  validateJavaKeystore = (req, res) => {
    this._validateAndGetSignatureFromJavaKeystore(req.params.configId).then(signature => {
      res.status(200).send(true)
    }).catch(e => {
      console.error(e)
      res.status(500).send(e)
    })
  }

  generateJavaKeystore = (req, res) => {
    this._generateJavaKeystoreFile(req.body).then(
      filePath => {
        res.download(filePath, 'keystore.jks', (err) => {
          if (err) {
            console.error("keystore send error")
            console.error(err)
          } else {
            console.log("successfully sent a keystore file.")
          }
          fs.removeSync(filePath)
        })
      }
    ).catch(err => {
      console.error(err)
      res.status(500).send(err)
    })
  }
}

const clientBuildCtrl = new OTClientBuildCtrl()
export { clientBuildCtrl }
