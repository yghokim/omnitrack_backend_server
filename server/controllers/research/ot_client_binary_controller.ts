import OTClientBinary from "../../models/ot_client_binary";
import * as multer from "multer";
import * as mime from "mime";
import { StorageEngine } from "multer";
import * as fs from "fs-extra";
import * as path from "path";
//import { Extract } from 'app-metadata';
import { getExtensionFromPath } from "../../../shared_lib/utils";
const randomstring  = require('randomstring');
const PkgReader = require('isomorphic-apk-reader');


export default class OTBinaryCtrl{

  private makeClientBinaryStorage(): StorageEngine {
    return multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "storage/temp/clients")
      },
      filename: function (req, file, cb) {
        const tempName = "temp_client_" + randomstring.generate({length: 20})
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
      if(req.researcher.previlage >= 1)
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
            /*
            Extract.run(req.file.path).then(result=>{
              console.log(result)
            }).catch(err=>{
              console.log("app metadata parse error")
              console.log(err)
              res.status(500).send({error: "InvalidPackage", rawError: err})
            })*/

            
            const pkgReader = new PkgReader(req.file.path, extension, {withIcon: false, searchResource: true})
            pkgReader.parse((err, packageInfo)=>{
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

                fs.move(req.file.path, "storage/clients/" + (packageInfo.platform || "unknownPlatform") + "/omnitrack_client_" + packageInfo.platform + "_" + Date.now() + "." + extension)
                  .then(()=>{
                    res.status(200).send(true)
                  })
                  .catch(reason=>{
                    console.log(reason)
                    res.status(500).send({error: reason})
                  })

              }
              else{
                console.log(err)
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