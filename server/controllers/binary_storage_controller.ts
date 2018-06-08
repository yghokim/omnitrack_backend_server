import { Request, Response } from "express";
import * as multer from "multer";
import * as mime from "mime";
import { StorageEngine } from "multer";
import * as path from "path";
import OTItemMedia from '../models/ot_item_media';
import * as app from '../app';
import C from '../server_consts'
const fs = require("fs-extra");

export default class BinaryStorageCtrl {

  private makeUserItemMediaStorage(userId: String, trackerId: String, itemId: String, attrLocalId: String, fileIdentifier: String): StorageEngine {
    return multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "storage/temp/media")
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

  getAll = (req, res) => {
    OTItemMedia.find({}).then(
      media=>{
        res.status(200).send(media)
      }
    ).catch(err=>{
      res.status(500).send(err)
    })
  }

  uploadItemMedia = (req: Request, res: Response) => {
    const userId = res.locals.user.uid
    if (userId != null) {
      const trackerId = req.params.trackerId
      const attrLocalId = req.params.attrLocalId
      const itemId = req.params.itemId
      const fileIdentifier = req.params.fileIdentifier

      const upload = multer({ storage: this.makeUserItemMediaStorage(userId, trackerId, itemId, attrLocalId, fileIdentifier) })
        .single("file")
      upload(req, res, err => {
        if (err != null) {
          console.log(err)
          res.status(500).send({ error: err })
        } else {
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
                (mediaUpdateError, beforeUpdated) => {
                  if (mediaUpdateError) {
                    console.log(mediaUpdateError)
                    res.status(500).send({ error: mediaUpdateError })
                  } else {
                    const removalPromises = []
                    if (beforeUpdated.value != null) {
                      removalPromises.push(fs.remove(prefix + beforeUpdated.value.originalFileName).catch(fileRemovalError => false))
                      if (beforeUpdated.value.processedFileNames) {
                        for (const type in beforeUpdated.value.processedFileNames) {
                          if (beforeUpdated.value.processedFileNames.hasOwnProperty(type)) {
                            removalPromises.push(
                              fs.remove(prefix + beforeUpdated.value.processedFileNames[type]).catch(fileRemoveError => false)
                            )
                          }
                        }
                      }

                      Promise.all(removalPromises).then(
                        result => {
                          req.app.get("omnitrack").serverModule.agenda.now(C.TASK_POSTPROCESS_ITEM_MEDIA, { mediaDbId: beforeUpdated.value._id }, function (agendaError, jobs) {

                          });
                          res.status(200).send({ result: "success", overwritten: true })
                        }
                      ).catch(removalError => {
                        console.log(removalError)
                        req.app.get("omnitrack").serverModule.agenda.now(C.TASK_POSTPROCESS_ITEM_MEDIA, { mediaDbId: beforeUpdated.value._id }, function (agendaError, jobs) {

                        });
                        res.status(200).send({ result: "success", overwritten: true })
                      })
                    } else {
                      req.app.get("omnitrack").serverModule.agenda.now(C.TASK_POSTPROCESS_ITEM_MEDIA, { mediaDbId: beforeUpdated.lastErrorObject.upserted }, function (agendaError, jobs) {

                      });
                      res.status(200).send({ result: "success", overwritten: false })
                    }
                  }
                }
              )
            })
            .catch(err2 => {
              console.log(err2)
              res.status(500).send({ error: err2 })
            })
        }
      })
    } else {
      res.status(500).send({ message: "" })
    }
  }

  downloadItemMedia = (req: any, res: Response) => {
    if(res.locals.user || req.researcher) {
      const trackerId = req.params.trackerId
      const attrLocalId = req.params.attrLocalId
      const itemId = req.params.itemId
      const fileIdentifier = req.params.fileIdentifier
      const processingType = req.params.processingType || "original"

      OTItemMedia.collection.findOne({
        tracker: trackerId,
        attrLocalId: attrLocalId,
        item: itemId,
        fileIdentifier: fileIdentifier
      }, (err, media) => {
        console.log("found one media")
        console.log(err)
        console.log(media)
        if (err) {
          res.status(500).send({ error: err })
          return
        }

        if (media) {
          console.log("found media")
          let fileName: string = media.originalFileName
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

          res.download(req.app.get("omnitrack").serverModule.makeItemMediaFileDirectoryPath(media.user, trackerId, itemId) + "/" + fileName, fileName,
            (err2) => {
              if (err2 == null) {
                console.log("item media download complete")
              } else {
                console.log(err2)
              }
            })
        } else {
          res.status(404).send({ message: "no media." })
        }
      })
    } else {
      res.status(500).send({ message: "" })
    }
  }
}
