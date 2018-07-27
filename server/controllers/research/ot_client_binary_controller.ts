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

  private extractSignature(filePath: string, cb: (err, print: string) => void) {
    yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        cb(err, null)
        return
      } else {
        zipfile.readEntry();
        zipfile.on("entry", (entry) => {
          console.log("entry name: " + entry.fileName)
          if (entry.fileName.toUpperCase() === "META-INF/CERT.RSA") {
            // keystore file.
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) { throw err; }
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
                    cb(null, matches[1])
                  } else {
                    cb("keytool failed", null)
                  }
                })
              });
              readStream.pipe(fs.createWriteStream(keystoreTempFilePath));
            });
          } else { zipfile.readEntry(); }
        })
      }
    })
  }

  postClientBinaryFile = (req, res) => {
    if (req.researcher) {
      if (req.researcher.previlage >= 1) {
        console.log("upload client binary to server.")
        const upload = multer({ storage: this.makeClientBinaryStorage() }).single("file")
        const changelog = req.query.changelog
        upload(req, res, err => {
          if (err != null) {
            console.log(err)
            res.status(500).send(err)
          } else {
            md5File(req.file.path).then(hash => {
              return OTClientBinary.findOne({ checksum: hash }, { select: "_id" }).then(duplicate => {
                return duplicate == null ? hash : null
              })
            }).then(
              hash => {
                if (!hash) {
                  res.status(500).send({ error: "FileAlreadyExists" })
                } else {
                  const extension = getExtensionFromPath(req.file.originalname)
                  Extract.run(req.file.path).then(
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

                      const filename = "omnitrack_client_" + platform.toLowerCase() + "_" + Date.now() + "." + extension

                      const filePath = this.makeClientFilePath(platform, filename)

                      fs.move(req.file.path, filePath)
                        .then(() => {
                          const model = {
                            version: ClientBinaryUtil.getAppVersionName(packageInfo),
                            versionCode: ClientBinaryUtil.getAppVersionCode(packageInfo),
                            platform: platform,
                            fileSize: req.file.size,
                            minimumOsVersion: ClientBinaryUtil.getMinimumOSVersion(packageInfo),
                            minimumOsVersionReadable: ClientBinaryUtil.getMinimumOSVersionString(packageInfo),
                            fileName: filename,
                            originalFileName: req.file.originalname,
                            checksum: hash,
                            changelog: changelog
                          }
                          new OTClientBinary(model).save().then(saved => {
                            console.log(saved)
                            this.extractSignature(filePath, (signatureExtractionError, print) => {
                              if (signatureExtractionError) {
                                res.status(500).send({ error: "UnsignedClient", raw: signatureExtractionError })
                              } else {
                                console.log("fingerprint: " + print)
                                clientSignatureCtrl.upsertSignature(null, print, packageInfo.uniqueIdentifier, platform, true).then(
                                  changed => {
                                    res.status(200).send({ success: true, signatureUpdated: changed })
                                  }
                                )
                              }
                            })
                          })
                        })
                        .catch(reason => {
                          console.log(reason)
                          res.status(500).send({ error: reason })
                        })
                    })
                    .catch(err2 => {
                      console.log(err2)
                      res.status(500).send({ error: "InvalidPackage", raw: err2 })
                    })
                }
              })
          }
        })
      } else {
        res.status(500).send({ error: "PermissionDenied" })
      }
    } else {
      res.status(500).send({ error: "An admin researcher must be signed in." })
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

  getClientBinaries = (req, res) => {
    OTClientBinary.aggregate([{ $group: { _id: "$platform", binaries: { $push: "$$ROOT" } } }])
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
    OTClientBinary.findOneAndUpdate({ platform: req.query.platform, version: req.query.version }, { $inc: { downloadCount: 1 } }).then(
      binary => {
        if (binary) {
          res.download(this.makeClientFilePath(binary["platform"], binary["fileName"]), binary["originalFileName"], err => {
            if (err) {
              console.log(err)
            }
          })
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
    OTClientBinary.find({ platform: req.query.platform }).lean().then(
      binaries => {
        if (binaries && binaries.length > 0) {
          binaries.sort((binary1: any, binary2: any) => {
            return -compareVersions(binary1.version, binary2.version)
          })
          const latestBinary = binaries[0]
          const binaryInfo: VersionUpdaterInfo = {
            latestVersion: latestBinary["version"],
            latestVersionCode: latestBinary["versionCode"],
            url: overrideHostAddress + "/api/clients/download?platform=" + req.query.platform + "&version=" + latestBinary["version"],
            releaseNotes: latestBinary["changeLog"] || []
          }
          console.log(binaryInfo)
          res.status(200).send(binaryInfo)
        } else { res.status(404).send({ error: "NoBinaryForThisPlatform" }) }
      }
    )
  }

}

const clientBinaryCtrl = new OTBinaryCtrl()
export { clientBinaryCtrl }