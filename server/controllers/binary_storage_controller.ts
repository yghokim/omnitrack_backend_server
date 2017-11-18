import { Request, Response } from "express";
import * as multer from "multer";
import * as mime from "mime";
import { StorageEngine } from "multer";
import * as fs from "fs-extra";

export default class BinaryStorageCtrl{

    private makeUserItemMediaStorage(userId: String, trackerId: String, itemId: String, attrLocalId: String): StorageEngine{
        return multer.diskStorage({
            destination: function(req, file, cb){            
               cb(null, "storage/uploads/temp")
            },
            filename: function(req, file, cb){
                const tempName = userId + "_" + trackerId + itemId + attrLocalId + "_" + Date.now()+ '.' + mime.getExtension(file.mimetype) 
                const finalName = attrLocalId + "_" + Date.now()+ '.' + mime.getExtension(file.mimetype)
                file["finalName"] = finalName
                cb(null, tempName)
            }
        })
    }

    uploadAttributeMedia = (req: Request, res: Response)=>{
        const userId = res.locals.user.uid
        if(userId!=null)
        {
            const trackerId = req.params.trackerId
            const attrLocalId = req.params.attrLocalId
            const itemId = req.params.itemId
            
            const upload = multer({storage: this.makeUserItemMediaStorage(userId, trackerId, itemId, attrLocalId)})
                .single("file")
            upload(req, res, err=>{
                if(err != null)
                {
                    console.log(err)
                    res.status(500).send({error: err})
                }
                else{
                    fs.move(req.file.path, "storage/uploads/users/" + userId + "/" + trackerId + "/" + itemId + "/" + req.file["finalName"])
                    .then(()=>
                        {
                            res.status(200).send({result: "success"})
                    })
                    .catch(err=>{
                        console.log(err)
                        res.status(500).send({error: err})
                    })
                }
            })
        }
        else{
            res.status(500).send({message: ""})
        }
    }
}