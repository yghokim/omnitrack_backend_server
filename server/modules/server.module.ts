import OTTracker from '../models/ot_tracker';
import OTItem from '../models/ot_item';
import OTParticipant from '../models/ot_participant';
import OTExperiment from '../models/ot_experiment';
import OTItemMedia from '../models/ot_item_media';
import OTClientBinary from '../models/ot_client_binary';
import OTUser from '../models/ot_user';
import { Express } from 'express';
import * as path from 'path';
import * as Agenda from 'agenda';
import * as easyimage from "easyimage";
import C from "../server_consts"
import { SyncInfo, PushOptions, MessageData } from '../modules/push.module'
import env from '../env'
import app from '../app'
import OTResearcher from '../models/ot_researcher';

export default class ServerModule {

  readonly agenda: Agenda

  constructor() {
    this.agenda = this.newAgendaBase()
  }

  bootstrap() {
    try {
      /*
      OTParticipant.find({}, {select: "_id experiment invitation user"}).populate("user").populate("experiment").populate("invitation").then(
        participants => {
          const removeIds = participants.filter( p => !p["experiment"] || !p["invitation"] || !p["user"]).map(p => p._id)
          OTParticipant.remove({_id: {$in: removeIds}}).then(result => {
            console.log(result["n"] + " dangling participants were removed.")
          })
        }
      )*/

      //handle super users
      OTResearcher.updateMany({email: {$in: env.super_users}, account_approved: {$ne: true}}, {account_approved: true}).then((updated)=>{
        console.log(updated.nModified + " researchers became new superuser.")
      }).catch(err=>{
        console.log(err)
      })

      OTClientBinary.find({}).then(
        binaries=>{
          binaries.forEach(binary => {
            binary["version"] = binary["version"].replace(/ /g, "-")
            console.log(binary["version"])
            binary.save().then()
          })
        }
      ).catch(err=>{
        console.log(err)
      })

      OTParticipant.find({experimentRange: {$exists:false}, approvedAt: {$exists: true}}).then(
        participants=>
        {
          if(participants)
          {
            Promise.all(participants.map(participant => {
              participant["experimentRange"] = {from: participant["approvedAt"], to: null}
              participant.markModified("experimentRange")
              return participant.save()
            })).then(result => {
              console.log(participants.length + " participants were updated regarding their experimentRange.")
            })
          }
        }
      )
      
      OTExperiment.collection.dropIndex("trackingPackages.key_1").catch(err=>{})

      OTResearcher.collection.dropIndex("password_reset_token_1").catch(err => {})
      OTItem.collection.dropIndex("objectId_1").catch(err => {})
      OTTracker.collection.dropIndex("objectId_1").catch(err => {})

    } catch (err) {

    }

    this.agenda.on('ready', () => {
      this.defineItemMediaPostProcessAgenda()
      this.defineDataMessagePushAgenda()

      this.agenda.start()
    })
  }

  private defineItemMediaPostProcessAgenda() {
    this.agenda.define(C.TASK_POSTPROCESS_ITEM_MEDIA, (job, done) => {
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
              .then((file) => {
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
            // another mime types
          }
        })
      } else {
        done()
      }
    })
  }

  private newAgendaBase(): Agenda {
    let mongoDbUri: string
    if (env.node_env === 'test') {
      mongoDbUri = env.mongodb_test_uri
    } else {
      mongoDbUri = env.mongodb_uri
    }

    return new Agenda({ db: { address: mongoDbUri } })
  }


  makeItemMediaFileDirectoryPath(userId: string, trackerId: string, itemId: string): string {
    return "storage/uploads/users/" + userId + "/" + trackerId + "/" + itemId
  }

  private defineDataMessagePushAgenda() {
    this.agenda.define(C.TASK_PUSH_DATA, (job, done) => {
      console.log("start sending synchronization job..")
      const userId = job.attrs.data.userId
      const options = job.attrs.data.options
      const messagePayload = job.attrs.data.messagePayload

      app.pushModule().sendDataPayloadMessageToUser(userId, messagePayload, options).then(arr => {
        console.log(arr)
        done()
      }).catch((err) => {
        console.log(err)
        done(new Error("push error"))
      })
    })
  }

  registerMessageDataPush(userId: string|string[], messageData: MessageData, options: PushOptions = {excludeDeviceIds: []}) {
    console.log("send synchronization push - " + userId)
    this.agenda.now(C.TASK_PUSH_DATA, {userId: userId, messagePayload: messageData.toMessagingPayloadJson(), options: options}, (err) => {
      if (err) {

      } else {
        console.log("sent push messages successfully.")
      }
    })
  }
}
