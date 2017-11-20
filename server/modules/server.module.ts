import OTTracker from '../models/ot_tracker';
import OTItem from '../models/ot_item';
import OTItemMedia from '../models/ot_item_media';
import { Express } from 'express';
import * as path from 'path';
import * as Agenda from 'agenda';
import * as easyimage from "easyimage";

export default class ServerModule {

  readonly agenda: Agenda

  constructor(private app: any) {
    this.agenda = this.newAgendaBase()
  }

  bootstrap() {
    try {
      OTItem.collection.dropIndex("objectId_1")
      OTTracker.collection.dropIndex("objectId_1")
    } catch (err) {

    }

    this.agenda.on('ready', () => {

      this.agenda.define("postprocess_item_media", (job, done) => {
        const mediaDbId = job.attrs.data.mediaDbId
        if (mediaDbId != null) {
          OTItemMedia.collection.findOne({ _id: mediaDbId }).then(entry => {
            const location = this.makeItemMediaFileDirectoryPath(entry.user, entry.tracker, entry.item)
            if (entry.mimeType.startsWith("image")) {
              easyimage.thumbnail({
                src: path.resolve(location, entry.originalFileName),
                dst: path.resolve(location, "thumb_retina_" + entry.originalFileName),
                width: 300,
                height: 300,
              })
              .then((file)=>{
                return easyimage.thumbnail({
                  src: path.resolve(location, entry.originalFileName),
                  dst: path.resolve(location, "thumb_" + entry.originalFileName),
                  width: 150,
                  height: 150,
                })
              })
              .then((file) => {
                console.log("thumbnail was converted successfully.")
                entry.processedFileNames["thumb"] = "thumb_" + entry.originalFileName
                entry.processedFileNames["thumb_retina"] = "thumb_retina_" + entry.originalFileName
                console.log(entry)

                entry.isProcessed = true
                OTItemMedia.collection.updateOne({ _id: entry._id }, entry).then(
                  () => {
                    done()
                  })
              })
            } else {
              //another mime types
            }
          })
        }else {
          done()
        }
        })
    this.agenda.start()
  })
}

  private newAgendaBase(): Agenda {
  var mongoDbUri: string
  if (process.env.NODE_ENV === 'test') {
    mongoDbUri = process.env.MONGODB_TEST_URI
  } else {
    mongoDbUri = process.env.MONGODB_URI
  }

  return new Agenda({ db: { address: mongoDbUri } })
}


makeItemMediaFileDirectoryPath(userId: string, trackerId: string, itemId: string): string {
  return "storage/uploads/users/" + userId + "/" + trackerId + "/" + itemId
}
}
