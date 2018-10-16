import OTClientBinary from "../../models/ot_client_binary";
import OTClientSignature from '../../models/ot_client_signature';
import { clientSignatureCtrl } from '../../controllers/ot_client_signature_controller';
import * as multer from "multer";
import * as mime from "mime";
import { StorageEngine } from "multer";
import * as path from "path";
import { getExtensionFromPath, compareVersions } from "../../../shared_lib/utils";
import { ClientBinaryUtil } from '../../../omnitrack/core/client_binary_utils';
import { Extract, OperatingSystem } from 'app-metadata';
import { resolve } from "dns";
import { checkFileExistenceAndType } from "../../server_utils";
const randomstring = require('randomstring');
const md5File = require('md5-file/promise');
const fs = require("fs-extra");
const yauzl = require('yauzl');

interface VersionUpdaterInfo {
  latestVersion: string,
  latestVersionCode: number,
  url: string,
  releaseNotes: Array<string>
}

export default class OTBinaryCtrl {
  private makeClientFilePath(platform: string, filename: string): string {
    return "storage/clients/" + platform.toLowerCase() + "/" + filename
  }

  private makeClientBinaryStorage(): StorageEngine {
    return multer.diskStorage({
      destination: function (req, file, cb) {
        fs.ensureDir("storage/temp/clients").then(() => {
          cb(null, "storage/temp/clients")
        }).catch(err => {
          cb(err, null)
        })
      },
      filename: function (req, file, cb) {
        const tempName = "temp_client_" + randomstring.generate({ length: 20 })
          + "_" + Date.now() + "." +
          getExtensionFromPath(file.originalname)
        console.log("binary will be saved temporarily as " + tempName)
        cb(null, tempName)
      }
    })
  }

  private extractSignature(filePath: string): Promise<string> {
    // tslint:disable-next-line:no-shadowed-variable
    return new Promise((resolve, reject) => {
      yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          reject(err)
          return
        } else {
          zipfile.readEntry();
          zipfile.on("entry", (entry) => {
            console.log("entry name: " + entry.fileName)
            if (entry.fileName.toUpperCase() === "META-INF/CERT.RSA") {
              // keystore file.
              zipfile.openReadStream(entry, (zipOpenError, readStream) => {
                if (zipOpenError) { reject(zipOpenError) }
                fs.ensureDirSync("storage/temp")
                const keystoreTempFilePath = "storage/temp/temp_keystore_" + randomstring.generate({ length: 20 })
                  + "_" + Date.now() + ".rsa"
                readStream.on("end", function () {
                  console.log("extracted rsa file")
                  const { spawn } = require('child_process'),
                    keytool = spawn('keytool', ['-printcert', '-file', keystoreTempFilePath]);
                  keytool.stdout.on("data", data => {
                    keytool.stdout.destroy()
                    fs.remove(keystoreTempFilePath)
                    const regex = /\s([0-9A-F]{2}(:[0-9A-F]{2}){19})\s/g
                    const matches = regex.exec(data)
                    if (matches.length > 1) {
                      resolve(matches[1])
                    } else {
                      reject(new Error("keytool failed"))
                    }
                  })
                });
                readStream.pipe(fs.createWriteStream(keystoreTempFilePath));
              });
            } else { zipfile.readEntry(); }
          })
        }
      })
    })
  }

  _getLatestVersionInfoForExperiment(experimentId: string, platform: string): Promise<{ versionName: string, versionCode: number }> {
    return OTClientBinary.findOne({ experiment: experimentId, platform: platform }, {}, { sort: { versionCode: -1 } }).lean().then(
      binary => {
        if (binary) {
          return {
            versionName: binary["version"],
            versionCode: binary["versionCode"]
          }
        } else { return null }
      }
    )
  }

  _registerNewClientBinary(clientFilePath: string, changelog: Array<string>, fileSize?: number, originalName?: string, experimentId?: string): Promise<{ success: boolean, signatureUpdated: boolean }> {
    return md5File(clientFilePath).then(hash => {
      const query: any = { checksum: hash }
      if (experimentId) {
        query.experiment = experimentId
      }
      return OTClientBinary.findOne(query, { select: "_id" }).then(duplicate => {
        return duplicate == null ? hash : null
      })
    }).then(
      hash => {
        if (!hash) {
          throw { error: "FileAlreadyExists" }
        } else {
          const extension = getExtensionFromPath(clientFilePath)
          return Extract.run(clientFilePath).then(
            packageInfo => {
              let platform = "unknown"
              switch (packageInfo.operatingSystem) {
                case OperatingSystem.Android:
                  platform = "Android"
                  break;
                case OperatingSystem.iOS:
                  platform = "iOS"
                  break;
                case OperatingSystem.Windows:
                  platform = "Windows"
                  break;
              }
              console.log(packageInfo)

              const filename = "omnitrack_client_" + (experimentId ? (experimentId + "_") : "") + platform.toLowerCase() + "_" + Date.now() + "." + extension

              const filePath = this.makeClientFilePath(platform, filename)

              return fs.move(clientFilePath, filePath)
                .then(() => {
                  if (!fileSize) {
                    const stat = fs.statSync(filePath)
                    fileSize = stat.size
                  }

                  if (!originalName) {
                    originalName = path.basename(clientFilePath)
                  }

                  const model = {
                    experiment: experimentId,
                    version: ClientBinaryUtil.getAppVersionName(packageInfo),
                    versionCode: ClientBinaryUtil.getAppVersionCode(packageInfo),
                    platform: platform,
                    fileSize: fileSize,
                    minimumOsVersion: ClientBinaryUtil.getMinimumOSVersion(packageInfo),
                    minimumOsVersionReadable: ClientBinaryUtil.getMinimumOSVersionString(packageInfo),
                    fileName: filename,
                    originalFileName: originalName,
                    checksum: hash,
                    needsConfirm: experimentId ? true : false,
                    changelog: changelog
                  }
                  return new OTClientBinary(model).save().then(saved => {
                    console.log(saved)
                    return this.extractSignature(filePath)
                  }).then(print => {
                    console.log("fingerprint: " + print)
                    return clientSignatureCtrl.upsertSignature(null, print, packageInfo.uniqueIdentifier, platform, experimentId, true).then(
                      changed => {
                        return { success: true, signatureUpdated: changed }
                      })
                  })
                })
                .catch(reason => {
                  console.error(reason)
                  throw { error: reason }
                })
            })
            .catch(err2 => {
              throw { error: "InvalidPackage", raw: err2 }
            })
        }
      })
  }

  postClientBinaryFile = (req, res) => {
    if (req.researcher.previlage >= 1) {
      console.log("upload client binary to server.")
      const upload = multer({ storage: this.makeClientBinaryStorage() }).single("file")
      const changelog = req.query.changelog
      upload(req, res, err => {
        if (err != null) {
          console.error(err)
          res.status(500).send(err)
        } else {
          this._registerNewClientBinary(req.file.path, changelog, req.file.size, req.file.originalname, req.query.experimentId).then(result => {
            res.status(200).send(result)
          }).catch(binaryRegisterError => {
            console.error(binaryRegisterError)
            res.status(500).send(binaryRegisterError)
          })
        }
      })
    } else {
      console.error("A researcher without permission cannot upload clients.")
      res.status(500).send({ error: "PermissionDenied" })
    }
  }

  removeClientBinary = (req, res) => {
    OTClientBinary.findByIdAndRemove(req.params.binaryId).then(
      removedBinary => {
        if (removedBinary) {
          fs.remove(this.makeClientFilePath(removedBinary["platform"], removedBinary["fileName"]), err => {
            if (!err) {
              console.log(err)
            }
            res.status(200).send(true)
          })
        } else {
          res.status(200).send(false)
        }
      }
    )
  }

  publishClientBinary = (req, res) => {
    OTClientBinary.findByIdAndUpdate(req.params.binaryId, { needsConfirm: false }).then(
      binary => {
        if (binary) {
          res.status(200).send(true)
        } else { res.status(404).send(false) }
      }
    ).catch(err => {
      console.error(err)
      res.status(500).send(err)
    })
  }

  getClientBinaries = (req, res) => {
    const match: any = { experiment: req.query.experimentId }
    if (req.query.platform) {
      match.platform = req.query.platform
    }

    OTClientBinary.aggregate([
      { $match: match },
      { $group: { _id: "$platform", binaries: { $push: "$$ROOT" } } }])
      .then(
        platforms => {
          platforms.forEach(platform => {
            platform.binaries.sort((binary1, binary2) => {
              return -compareVersions(binary1.version, binary2.version)
            })
          })
          res.status(200).send(platforms)
        }
      ).catch(err => {
        console.log(err)
        res.status(500).send(err)
      })
  }

  downloadClientBinary = (req, res) => {

    OTClientBinary.findOne({ experiment: (req.query.experimentId === "null" || !req.query.experimentId) ? null : req.query.experimentId, platform: req.query.platform, version: req.query.version }, {}, { sort: { "updatedAt": -1 } }).lean().then(
      binary => {
        if (binary) {
          const filePath = this.makeClientFilePath(binary["platform"], binary["fileName"])
          if (checkFileExistenceAndType(filePath) != null) {
            res.download(filePath, "omnitrack_release_" + binary["version"] + "." + getExtensionFromPath(binary["originalFileName"]), err => {

              if (err) {
                console.error(err)
              } else {
                //download complete
                if(req.query.notIncrementCount !== "true"){
                  OTClientBinary.updateOne({ _id: binary._id }, { $inc: { downloadCount: 1 } }).then(
                    updateResult => {
                    }
                  )
                }else{
                  console.log("binary file download. But do not increase the download count")
                }
              }
            })
          } else {
            //file does not exists.
            res.status(404).send("The installation file does not exist.")
          }
        } else {
          console.log("Binary not found.")
          res.status(404).send("Binary not found.")
        }
      }
    ).catch(err => {
      console.log(err)
      res.status(500).send(err)
    })
  }

  getLatestVersionInfo = (req, res) => {
    const overrideHostAddress = req.query.host
    OTClientBinary.find({ experiment: (req.query.experimentId === "null" || !req.query.experimentId) ? null : req.query.experimentId, needsConfirm: { $ne: true }, platform: req.query.platform }).lean().then(
      binaries => {
        if (binaries && binaries.length > 0) {
          binaries.sort((binary1: any, binary2: any) => {
            return -compareVersions(binary1.version, binary2.version)
          })
          const latestBinary = binaries[0]
          const binaryInfo: VersionUpdaterInfo = {
            latestVersion: latestBinary["version"],
            latestVersionCode: latestBinary["versionCode"],
            url: overrideHostAddress + "/api/clients/download?platform=" + req.query.platform + "&version=" + latestBinary["version"] + ((req.query.experimentId === "null" || !req.query.experimentId) ? "" : ("&experimentId=" + req.query.experimentId)),
            releaseNotes: latestBinary["changeLog"] || []
          }
          res.status(200).send(binaryInfo)
        } else { res.status(200).send(null) }
      }
    )
  }

}

const clientBinaryCtrl = new OTBinaryCtrl()
export { clientBinaryCtrl }
