import { Response } from "express";
import * as multer from "multer";
import * as mime from "mime";
import { StorageEngine } from "multer";
import OTItemMedia from '../models/ot_item_media';
import C from '../server_consts'
const fs = require("fs-extra");

export default class BinaryStorageCtrl {

  private makeUserItemMediaStorage(userId: String, trackerId: String, itemId: String, fieldLocalId: String, fileIdentifier: String): StorageEngine {
    return multer.diskStorage({
      destination: function (req, file, cb) {
        fs.ensureDir("storage/temp/media").then(() => {
          cb(null, "storage/temp/media")
        }).catch(err => {
          cb(err, null)
        })
      },
      filename: function (req, file, cb) {
        const tempName = userId + "_" + trackerId + itemId + fieldLocalId + "_" + Date.now() + '.' + mime.getExtension(file.mimetype)
        const finalNameBase = fieldLocalId + "_" + fileIdentifier + "_" + Date.now()
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

  uploadItemMedia = (req, res: Response) => {
    const userId = req.user.uid
    const trackerId = req.params.trackerId
    const fieldLocalId = req.params.fieldLocalId
    const itemId = req.params.itemId
    const fileIdentifier = req.params.fileIdentifier

    const upload = multer({ storage: this.makeUserItemMediaStorage(userId, trackerId, itemId, fieldLocalId, fileIdentifier) })
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
              fieldLocalId: fieldLocalId,
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
              fieldLocalId: fieldLocalId,
              item: itemId,
              fileIdentifier: fileIdentifier
            }).then(oldDoc => {
              if (oldDoc) {
                // update current and change file
                const removalPromises = []
                removalPromises.push(fs.remove(prefix + oldDoc["originalFileName"])
                  .then(() => true).catch(() => false))
                if (oldDoc["processedFileNames"]) {
                  for (const type in oldDoc["processedFileNames"]) {
                    if (oldDoc["processedFileNames"].hasOwnProperty(type)) {
                      removalPromises.push(
                        fs.remove(prefix + oldDoc["processedFileNames"][type]).then(() => true).catch(() => false)
                      )
                    }
                  }
                }

                return Promise.all(removalPromises).then(
                  () => {
                    return oldDoc.update(newMedia).then(() => ({ overwritten: true, _id: oldDoc._id }))
                  }
                )
              } else {
                // insert new one
                return new OTItemMedia(newMedia as any).save().then(newDoc => ({ overwritten: false, _id: newDoc._id }))
              }
            }).then(result => {
              return req.app.get("omnitrack").serverModule.agenda
                .now(C.TASK_POSTPROCESS_ITEM_MEDIA, { mediaDbId: result._id })
                .then(() => {
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
    if (req.user || req.researcher) {
      const trackerId = req.params.trackerId
      const fieldLocalId = req.params.fieldLocalId
      const itemId = req.params.itemId
      const fileIdentifier = req.params.fileIdentifier
      const processingType = req.params.processingType || "original"

      OTItemMedia.findOne({
        tracker: trackerId,
        fieldLocalId: fieldLocalId,
        item: itemId,
        fileIdentifier: fileIdentifier
      }).lean<any>().then((media: any) => {
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

          const filePath = req.app.get("omnitrack").serverModule.makeItemMediaFileDirectoryPath(media.user, trackerId, itemId) + "/" + fileName
          if (fs.existsSync(filePath) === true) {
            res.download(filePath, fileName,
              (err2) => {
                if (err2 == null) {
                  console.log("item media download complete")
                } else {
                  console.log(err2)
                }
              })
          } else {
            console.error("Media entry exists, but no file at " + filePath)
            res.status(404).send({ message: "no media file." })
          }

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
