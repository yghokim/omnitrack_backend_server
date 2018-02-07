import OTClientBinary from "../../models/ot_client_binary";
import * as multer from "multer";
import * as mime from "mime";
import { StorageEngine } from "multer";
import * as path from "path";
import { getExtensionFromPath } from "../../../shared_lib/utils";
import { ClientBinaryUtil } from '../../../omnitrack/core/client_binary_utils';
const randomstring = require('randomstring');
const PkgReader = require('isomorphic-apk-reader');
const md5File = require('md5-file/promise');
const fs = require("fs-extra");

export default class OTBinaryCtrl {
  private makeClientFilePath(platform: string, filename: string): string {
    return "storage/clients/" + platform.toLowerCase() + "/" + filename
  }

  private makeClientBinaryStorage(): StorageEngine {
    return multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "storage/temp/clients")
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

  postClientBinaryFile = (req, res) => {
    if (req.researcher) {
      if (req.researcher.previlage >= 1) {
        console.log("upload client binary to server.")
        const upload = multer({ storage: this.makeClientBinaryStorage() }).single("file")

        upload(req, res, err => {
          if (err != null) {
            console.log(err)
            res.status(500).send(err)
          }
          else {
            md5File(req.file.path).then(hash => {
              return OTClientBinary.findOne({checksum: hash}, {select: "_id"}).then(duplicate=>{
                return duplicate == null ? hash : null
              })
            }).then(
              hash=>{
                if(!hash){
                  res.status(500).send({error: "FileAlreadyExists"})
                }else{
                  const extension = getExtensionFromPath(req.file.originalname)
                  const pkgReader = new PkgReader(req.file.path, extension, { withIcon: false, searchResource: true })
                  pkgReader.parse((err, packageInfo) => {
                    if (!err) {
                      switch (extension) {
                        case "apk":
                          packageInfo.platform = "Android"
                          break;
                        case "ipa":
                          packageInfo.platform = "iOS"
                          break;
                      }
                      console.log(packageInfo)
    
                      const filename = "omnitrack_client_" + packageInfo.platform.toLowerCase() + "_" + Date.now() + "." + extension
    
                      fs.move(req.file.path, this.makeClientFilePath(packageInfo.platform, filename))
                        .then(() => {
                          const model = {
                            version: ClientBinaryUtil.getAppVersionName(packageInfo),
                            platform: packageInfo.platform,
                            fileSize: req.file.size,
                            minimumOsVersion: ClientBinaryUtil.getMinimumOSVersion(packageInfo),
                            minimumOsVersionReadable: ClientBinaryUtil.getMinimumOSVersionString(packageInfo),
                            fileName: filename,
                            originalFileName: req.file.originalname,
                            checksum: hash
                          }
                          new OTClientBinary(model).save().then(saved=>{
                            console.log(saved)
                            res.status(200).send(true)
                          })
                        })
                        .catch(reason => {
                          console.log(reason)
                          res.status(500).send({ error: reason })
                        })
                    }
                    else {
                      console.log(err)
                      res.status(500).send({ error: "InvalidPackage" })
                    }
                  })
                }
              })
          }
        })
      }
      else {
        res.status(500).send({ error: "PermissionDenied" })
      }
    }
    else {
      res.status(500).send({ error: "An admin researcher must be signed in." })
    }
  }

  getClientBinaries = (req, res)=>{
    OTClientBinary.aggregate([{$group: {_id: "$platform", binaries: {$push: "$$ROOT"}}}])
    .then(
      binaries=>{
        console.log(binaries)
        res.status(200).send(binaries)
      }
    ).catch(err=>{
      console.log(err)
      res.status(500).send(err)
    })
  }

  getLatestVersions = (req, res)=>{

  }

  downloadClientBinary = (req, res)=>{
    OTClientBinary.findOneAndUpdate({platform: req.query.platform, version: req.query.version}, {$inc: {downloadCount: 1}}).then(
      binary=>{
        if(binary){
          res.download(this.makeClientFilePath(binary["platform"], binary["fileName"]), binary["originalFileName"], err=>{
            if(err){
              res.status(500).send(err)
            }
          })
        }else{
          console.log("Binary not found.")
          res.status(404).send("Binary not found.")
        }
      }
    ).catch(err=>{
      console.log(err)
      res.status(500).send(err)
    })
  }

}

const clientBinaryCtrl = new OTBinaryCtrl()
export { clientBinaryCtrl }