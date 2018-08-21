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
        fs.ensureDir("storage/temp/media").then(() => {
          cb(null, "storage/temp/media")
        }).catch(err => {
          cb(err, null)
        })
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
      media => {
        res.status(200).send(media)
      }
    ).catch(err => {
      res.status(500).send(err)
    })
  }

  uploadItemMedia = (req: Request, res: Response) => {
    const userId = res.locals.user.uid
    const trackerId = req.params.trackerId
    const attrLocalId = req.params.attrLocalId
    const itemId = req.params.itemId
    const fileIdentifier = req.params.fileIdentifier

    const upload = multer({ storage: this.makeUserItemMediaStorage(userId, trackerId, itemId, attrLocalId, fileIdentifier) })
      .single("file")
    upload(req, res, multerError => {
      if (multerError != null) {
        console.log(multerError)
        res.status(500).send({ error: multerError })
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

            OTItemMedia.findOne({
              tracker: trackerId,
              user: userId,
              attrLocalId: attrLocalId,
              item: itemId,
              fileIdentifier: fileIdentifier
            }).then(oldDoc => {
              if (oldDoc) {
                // update current and change file
                const removalPromises = []
                removalPromises.push(fs.remove(prefix + oldDoc["originalFileName"])
                  .then(() => true).catch(fileRemovalError => false))
                if (oldDoc["processedFileNames"]) {
                  for (const type in oldDoc["processedFileNames"]) {
                    if (oldDoc["processedFileNames"].hasOwnProperty(type)) {
                      removalPromises.push(
                        fs.remove(prefix + oldDoc["processedFileNames"][type]).then(() => true).catch(fileRemoveError => false)
                      )
                    }
                  }
                }

                return Promise.all(removalPromises).then(
                  result => {
                    return oldDoc.update(newMedia).then(() => ({ overwritten: true, _id: oldDoc._id }))
                  }
                )
              } else {
                // insert new one
                return new OTItemMedia(newMedia).save().then(newDoc => ({ overwritten: false, _id: newDoc._id }))
              }
            }).then(result => {
              return req.app.get("omnitrack").serverModule.agenda
                .now(C.TASK_POSTPROCESS_ITEM_MEDIA, { mediaDbId: result._id })
                .then(job => {
                  console.log("successed postprocessing media.")
                  return result
                }).catch(processErr => {
                  console.error(processErr)
                  return result
                })
            }).then(result => {
              res.status(200).send({ result: "success", overwritten: result.overwritten })
            })
          })
          .catch(err => {
            console.log(err)
            res.status(500).send({ error: err })
          })
      }
    })
  }

  downloadItemMedia = (req: any, res: Response) => {
    if (res.locals.user || req.researcher) {
      const trackerId = req.params.trackerId
      const attrLocalId = req.params.attrLocalId
      const itemId = req.params.itemId
      const fileIdentifier = req.params.fileIdentifier
      const processingType = req.params.processingType || "original"

      OTItemMedia.findOne({
        tracker: trackerId,
        attrLocalId: attrLocalId,
        item: itemId,
        fileIdentifier: fileIdentifier
      }).lean().then(media => {
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
      }).catch(err => {
        res.status(500).send({ error: err })
      })
    } else {
      res.status(500).send("IllegalArguments")
    }
  }
}
