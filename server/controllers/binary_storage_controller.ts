import { Request, Response } from "express";
import * as multer from "multer";
import * as mime from "mime";
import { StorageEngine } from "multer";
import * as fs from "fs-extra";
import OTItemMedia from '../models/ot_item_media';

export default class BinaryStorageCtrl{

    private makeUserItemMediaStorage(userId: String, trackerId: String, itemId: String, attrLocalId: String, fileIdentifier: String): StorageEngine{
        return multer.diskStorage({
            destination: function(req, file, cb){            
               cb(null, "storage/uploads/temp")
            },
            filename: function(req, file, cb){
                const tempName = userId + "_" + trackerId + itemId + attrLocalId + "_" + Date.now()+ '.' + mime.getExtension(file.mimetype) 
                const finalName = attrLocalId + "_" + fileIdentifier + "_" + Date.now()+ '.' + mime.getExtension(file.mimetype)
                file["finalName"] = finalName
                cb(null, tempName)
            }
        })
    }

    private makeFinalFileDirectoryPath(userId: string, trackerId: string, itemId: string): string
    {
        return "storage/uploads/users/" + userId + "/" + trackerId + "/" + itemId 
    }

    uploadItemMedia = (req: Request, res: Response)=>{
        const userId = res.locals.user.uid
        if(userId!=null)
        {
            const trackerId = req.params.trackerId
            const attrLocalId = req.params.attrLocalId
            const itemId = req.params.itemId
            const fileIdentifier = req.params.fileIdentifier
            
            const upload = multer({storage: this.makeUserItemMediaStorage(userId, trackerId, itemId, attrLocalId, fileIdentifier)})
                .single("file")
            upload(req, res, err=>{
                if(err != null)
                {
                    console.log(err)
                    res.status(500).send({error: err})
                }
                else{

                    const prefix = this.makeFinalFileDirectoryPath(userId, trackerId, itemId) + "/"
                    fs.move(req.file.path, prefix + req.file["finalName"])
                    .then(()=>
                        {
                            const newMedia = {
                                user: userId,
                                tracker: trackerId,
                                attrLocalId: attrLocalId,
                                item: itemId,
                                fileIdentifier: fileIdentifier,
                                mimeType: req.file.mimetype,
                                originalFileSize: req.file.size,
                                originalFileName: req.file["finalName"],

                            }
                            //TODO postprocess files
                            
                            OTItemMedia.collection.findOneAndUpdate(
                                {
                                    tracker: trackerId, 
                                    user: userId, 
                                    attrLocalId: attrLocalId, 
                                    item: itemId, 
                                    fileIdentifier: fileIdentifier
                                },
                                newMedia, {upsert: true},
                                (err, beforeUpdated)=>{
                                    if(err){
                                        console.log(err)
                                        res.status(500).send({error: err})
                                    }
                                    else{
                                        console.log(beforeUpdated)
                                        const removalPromises = []
                                        removalPromises.push(fs.remove(prefix + beforeUpdated.value.originalFileName).catch(err=>false))
                                        if(beforeUpdated.value.processedFileNames)
                                        {
                                            beforeUpdated.value.processedFileNames.forEach(element => {
                                                removalPromises.push(
                                                    fs.remove(element.fileName).catch(err=>false)
                                                )
                                            });
                                        }
                                        
                                        Promise.all(removalPromises).then(
                                            result=>{
                                                res.status(200).send({result:"success"})
                                            }
                                        ).catch(err=>{
                                            console.log(err)
                                            res.status(200).send({result:"success"})
                                        })
                                    }
                                }
                            )
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

    downloadItemMedia= (req: Request, res: Response)=>{
        const userId = res.locals.user.uid
        if(userId!=null)
        {
            const trackerId = req.params.trackerId
            const attrLocalId = req.params.attrLocalId
            const itemId = req.params.itemId
            const fileIdentifier = req.params.fileIdentifier
            const processingType = req.params.processingType || "original"
            
            OTItemMedia.collection.findOne({
                tracker: trackerId, 
                user: userId, 
                attrLocalId: attrLocalId, 
                item: itemId, 
                fileIdentifier: fileIdentifier
            }, (err, media)=>{
                if(err){
                    res.status(500).send({error: err})
                    return
                }

                if(media){
                    //TODO processingType
                    res.download(this.makeFinalFileDirectoryPath(userId, trackerId, itemId) + "/" + media.originalFileName, media.originalFileName, 
                    (err)=>{
                        if(err == null)
                        {
                            console.log("item media download complete")
                        }
                        else{
                            console.log(err)
                        }
                    })
                }
                else{
                    res.status(404).send({message: "no media."})
                }
            })
        }
        else{
            res.status(500).send({message: ""})
        }
    }
}