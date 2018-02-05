import OTClientBinary from "../../models/ot_client_binary";
import * as multer from "multer";
import * as mime from "mime";
import { StorageEngine } from "multer";
import * as fs from "fs-extra";
import * as path from "path";
import { ResearcherPrevilages } from '../../../omnitrack/core/research/researcher'
import * as PkgReader from 'isomorphic-apk-reader';
import { getExtensionFromPath } from "../../../shared_lib/utils";
const randomstring  = require('randomstring');

export default class OTBinaryCtrl{

  private makeClientBinaryStorage(): StorageEngine {
    return multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "storage/temp/clients")
      },
      filename: function (req, file, cb) {
        const tempName = "temp_client" + randomstring.generate({length: 20})
 + "_" + Date.now() + "." + 
 getExtensionFromPath(file.originalname)
        console.log("binary will be saved temporarily as " + tempName)
        cb(null, tempName)
      }
    })
  }

  postClientBinaryFile = (req, res)=>{
    if(req.researcher)
    {
      if(req.researcher.previlage >= ResearcherPrevilages.ADMIN)
      {
        console.log("upload client binary to server.")
        const upload = multer({storage: this.makeClientBinaryStorage()}).single("file")

        upload(req, res, err => {
          if(err != null){
            console.log(err)
            res.status(500).send(err)
          }
          else{
            const extension = getExtensionFromPath(req.file.originalname)
            const pkgReader = new PkgReader(req.file.path, extension, {withIcon: false, searchResource: false}).parse((err, packageInfo)=>{
              if(!err){
                switch(extension){
                  case "apk":
                  packageInfo.platform = "android"
                  break;
                  case "ipa":
                  packageInfo.platform = "ios"
                  break;
                }
                console.log(packageInfo)
              }
              else{
                res.status(500).send({error: "InvalidPackage"})
              }
            })
          }
        })
      }
      else{
        res.status(500).send({error: "PermissionDenied"})
      }
    }
    else{
      res.status(500).send({error: "An admin researcher must be signed in."})
    }
  }
  


}

const clientBinaryCtrl = new OTBinaryCtrl()
export { clientBinaryCtrl }