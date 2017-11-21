import { Request, Response } from "express";
import * as multer from "multer";
import * as mime from "mime";
import { StorageEngine } from "multer";
import * as fs from "fs-extra";
import * as path from "path";
import OTItemMedia from '../models/ot_item_media';
import * as app from '../app';
import C from '../server_consts'

export default class BinaryStorageCtrl {

  private makeUserItemMediaStorage(app: any, userId: String, trackerId: String, itemId: String, attrLocalId: String, fileIdentifier: String): StorageEngine {
    return multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "storage/uploads/temp")
      },
      filename: function (req, file, cb) {
        const tempName = userId + "_" + trackerId + itemId + attrLocalId + "_" + Date.now() + '.' + mime.getExtension(file.mimetype)
        const finalNameBase = attrLocalId + "_" + fileIdentifier + "_" + Date.now()
        file["finalName"] = finalNameBase + '.' + mime.getExtension(file.mimetype)
        file["finalNameBase"] = finalNameBase
        cb(null, tempName)
      }
    })
  }

  uploadItemMedia = (req: Request, res: Response) => {
    const userId = res.locals.user.uid
    if (userId != null) {
      const trackerId = req.params.trackerId
      const attrLocalId = req.params.attrLocalId
      const itemId = req.params.itemId
      const fileIdentifier = req.params.fileIdentifier

      const upload = multer({ storage: this.makeUserItemMediaStorage(req.app, userId, trackerId, itemId, attrLocalId, fileIdentifier) })
        .single("file")
      upload(req, res, err => {
        if (err != null) {
          console.log(err)
          res.status(500).send({ error: err })
        }
        else {
          const prefix = req.app.get("omnitrack").serverModule.makeItemMediaFileDirectoryPath(userId, trackerId, itemId) + "/"
          const originalFilePath = prefix + req.file["finalName"]
          fs.move(req.file.path, originalFilePath)
            .then(() => {
              const newMedia = {
                user: userId,
                tracker: trackerId,
                attrLocalId: attrLocalId,
                item: itemId,
                fileIdentifier: fileIdentifier,
                mimeType: req.file.mimetype,
                originalFileSize: req.file.size,
                originalFileName: req.file["finalName"],
                processedFileNames: {},
                isProcessed: false,
                isInProcessing: false
              }

              OTItemMedia.collection.findOneAndUpdate(
                {
                  tracker: trackerId,
                  user: userId,
                  attrLocalId: attrLocalId,
                  item: itemId,
                  fileIdentifier: fileIdentifier
                },
                newMedia, { upsert: true },
                (err, beforeUpdated) => {
                  if (err) {
                    console.log(err)
                    res.status(500).send({ error: err })
                  }
                  else {
                    const removalPromises = []
                    if (beforeUpdated.value != null) {
                      removalPromises.push(fs.remove(prefix + beforeUpdated.value.originalFileName).catch(err => false))
                      if (beforeUpdated.value.processedFileNames) {
                        for (let type in beforeUpdated.value.processedFileNames) {
                          removalPromises.push(
                            fs.remove(prefix + beforeUpdated.value.processedFileNames[type]).catch(err => false)
                          )
                        }
                      }

                      Promise.all(removalPromises).then(
                        result => {
                          req.app.get("omnitrack").serverModule.agenda.now(C.TASK_POSTPROCESS_ITEM_MEDIA, { mediaDbId: beforeUpdated.value._id }, function (err, jobs) {

                          });
                          res.status(200).send({ result: "success", overwritten: true })
                        }
                      ).catch(err => {
                        console.log(err)
                        req.app.get("omnitrack").serverModule.agenda.now(C.TASK_POSTPROCESS_ITEM_MEDIA, { mediaDbId: beforeUpdated.value._id }, function (err, jobs) {
                        
                        });
                        res.status(200).send({ result: "success", overwritten: true })
                      })
                    } else {
                      req.app.get("omnitrack").serverModule.agenda.now(C.TASK_POSTPROCESS_ITEM_MEDIA, { mediaDbId: beforeUpdated.lastErrorObject.upserted }, function (err, jobs) {

                      });
                      res.status(200).send({ result: "success", overwritten: false })
                    }
                  }
                }
              )
            })
            .catch(err => {
              console.log(err)
              res.status(500).send({ error: err })
            })
        }
      })
    }
    else {
      res.status(500).send({ message: "" })
    }
  }

  downloadItemMedia = (req: Request, res: Response) => {
    const userId = res.locals.user.uid
    if (userId != null) {
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
      }, (err, media) => {
        if (err) {
          res.status(500).send({ error: err })
          return
        }

        if (media) {
          var fileName: string = media.originalFileName
          if (media.isProcessed) {
            switch (processingType) {
              case "original": fileName = media.originalFileName
                break
              case "thumb": fileName = media.processedFileNames.thumb
                break
              case "thumb_retina": fileName = media.processedFileNames.thumb_retina
                break
            }
          }

          res.download(req.app.get("omnitrack").serverModule.makeItemMediaFileDirectoryPath(userId, trackerId, itemId) + "/" + fileName, fileName,
            (err) => {
              if (err == null) {
                console.log("item media download complete")
              }
              else {
                console.log(err)
              }
            })
        }
        else {
          res.status(404).send({ message: "no media." })
        }
      })
    }
    else {
      res.status(500).send({ message: "" })
    }
  }
}
