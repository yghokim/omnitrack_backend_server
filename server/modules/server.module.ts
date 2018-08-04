import OTTracker from '../models/ot_tracker';
import OTItem from '../models/ot_item';
import OTParticipant from '../models/ot_participant';
import OTExperiment from '../models/ot_experiment';
import OTItemMedia from '../models/ot_item_media';
import OTClientBinary from '../models/ot_client_binary';
import OTClientBuildAction from '../models/ot_client_build_action';
import * as path from 'path';
import * as Agenda from 'agenda';
import * as easyimage from "easyimage";
import C from "../server_consts"
import { PushOptions, MessageData } from '../modules/push.module'
import env from '../env'
import app from '../app'
import OTResearcher from '../models/ot_researcher';
import { clientBuildCtrl } from '../controllers/research/ot_client_build_controller';
import { Job } from 'agenda';
import appWrapper from '../app';
import { SocketConstants, ClientBuildStatus, EClientBuildStatus } from '../../omnitrack/core/research/socket';

export default class ServerModule {

  readonly agenda: Agenda

  constructor() {
    let mongoDbUri: string
    if (env.node_env === 'test') {
      mongoDbUri = env.mongodb_agenda_test_uri
    } else {
      mongoDbUri = env.mongodb_agenda_uri
    }

    this.agenda = new Agenda({ db: { address: mongoDbUri } })
  }

  bootstrap() {
    console.log("bootstrapping a server module...")
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
      OTResearcher.updateMany({ email: { $in: env.super_users }, account_approved: { $ne: true } }, { account_approved: true }).then((updated) => {
        console.log(updated.nModified + " researchers became new superuser.")
      }).catch(err => {
        console.log(err)
      })

      OTClientBinary.find({}).then(
        binaries => {
          binaries.forEach(binary => {
            binary["version"] = binary["version"].replace(/ /g, "-")
            binary.save().then()
          })
        }
      ).catch(err => {
        console.log(err)
      })

      OTParticipant.find({ experimentRange: { $exists: false }, approvedAt: { $exists: true } }).then(
        participants => {
          if (participants) {
            Promise.all(participants.map(participant => {
              participant["experimentRange"] = { from: participant["approvedAt"], to: null }
              participant.markModified("experimentRange")
              return participant.save()
            })).then(result => {
              console.log(participants.length + " participants were updated regarding their experimentRange.")
            })
          }
        }
      )

    } catch (err) {

    }

    this.agenda.on('ready', () => {
      console.log("agenda is ready.")
      this.defineItemMediaPostProcessAgenda()
      this.defineDataMessagePushAgenda()
      this.defineBuildClientAppAgenda()

      this.agenda.start()
    })

    this.agenda.on('start:' + C.TASK_BUILD_CLIENT_APP, (job) => {
      const statusBase: ClientBuildStatus = {
        experimentId: job.attrs.data.experimentId,
        jobId: job.attrs._id,
        platform: job.attrs.data.platform,
        configId: job.attrs.data.configId,
        status: EClientBuildStatus.BUILDING
      }

      appWrapper.socketModule().sendDataToGlobalSubscribers(SocketConstants.SOCKET_MESSAGE_CLIENT_BUILD_STATUS, statusBase)

      new OTClientBuildAction({
        experiment: job.attrs.data.experimentId,
        platform: job.attrs.data.platform,
        config: job.attrs.data.configId,
        configHash: job.attrs.data.configHash,
        jobId: job.attrs._id
      }).save().then(
        saved => {
          console.log("saved new build action: ")
          console.log(saved)
        }
      ).catch(err => {
        console.error(err)
      })
    })

    this.agenda.on('success:' + C.TASK_BUILD_CLIENT_APP, (job) => {
      const statusBase: ClientBuildStatus = {
        experimentId: job.attrs.data.experimentId,
        jobId: job.attrs._id,
        platform: job.attrs.data.platform,
        configId: job.attrs.data.configId,
        status: EClientBuildStatus.SUCCEEDED
      }

      appWrapper.socketModule().sendDataToGlobalSubscribers(SocketConstants.SOCKET_MESSAGE_CLIENT_BUILD_STATUS, statusBase)
    })

    this.agenda.on('fail:' + C.TASK_BUILD_CLIENT_APP, (err, job) => {
      const statusBase: ClientBuildStatus = {
        experimentId: job.attrs.data.experimentId,
        jobId: job.attrs._id,
        platform: job.attrs.data.platform,
        configId: job.attrs.data.configId,
        status: EClientBuildStatus.FAILED,
        error: err
      }
      appWrapper.socketModule().sendDataToGlobalSubscribers(SocketConstants.SOCKET_MESSAGE_CLIENT_BUILD_STATUS, statusBase)


      OTClientBuildAction.updateOne(
        { jobId: job.attrs._id },
        {
          finishedAt: new Date(),
          result: EClientBuildStatus.FAILED,
          lastError: err
        }
      ).then((saved) => {
        if (saved.nModified > 0) {
          console.log("successfully updated a ClientBuildAction with error result.")
        } else {
          console.log("No ClientBuildActions were updated with error result.")
        }
      }).catch(e => {
        console.error(e)
      })
    })

    this.agenda.on('error', (err) => {
      if (err.startsWith("Error: Lost MongoDB connection") === true) {
        console.log("lost mongo connection. refresh aganda")
        this.agenda.start()
      }
    })
  }

  private defineBuildClientAppAgenda() {
    this.agenda.define(C.TASK_BUILD_CLIENT_APP, (job, done) => {
      const experimentId = job.attrs.data.experimentId
      const configId = job.attrs.data.configId

      console.log("start build app.")
      if (!experimentId || !configId) {
        const err = new Error("did not provide proper arguments.")
        return done(err)
      }

      this.cancelAllBuildJobsOfPlatform(job.attrs.data.experimentId, job.attrs.data.platform).then(numCanceled => {
        console.log("canceled", numCanceled, "pending build jobs. start mine.")
        clientBuildCtrl._build(configId, experimentId).then(
          buildResult => {
            console.log("finished client build. job id:", job.attrs._id)
            console.log("built binary info:")
            console.log(buildResult)
            OTClientBuildAction.updateOne({ jobId: job.attrs._id }, {
              finishedAt: new Date(),
              resut: EClientBuildStatus.SUCCEEDED,
              binaryFileName: buildResult.binaryFileName
            }).then(result => {
              console.log(result)
              done()
            }).catch(err => {
              console.error(err)
              done()
            })
          }
        ).catch(err => {
          console.log("client build finished with an error. job id:", job.attrs._id)
          done(err)
        })
      })
    })
  }

  private defineItemMediaPostProcessAgenda() {
    this.agenda.define(C.TASK_POSTPROCESS_ITEM_MEDIA, (job, done) => {
      const mediaDbId = job.attrs.data.mediaDbId
      if (mediaDbId != null) {
        OTItemMedia.findOne({ _id: mediaDbId }).then(entry => {
          const location = this.makeItemMediaFileDirectoryPath(entry["user"], entry["tracker"], entry["item"])
          if (entry["mimeType"].startsWith("image")) {
            easyimage.thumbnail({
              src: path.resolve(location, entry["originalFileName"]),
              dst: path.resolve(location, "thumb_retina_" + entry["originalFileName"]),
              width: 300,
              height: 300,
            })
              .then((file) => {
                return easyimage.thumbnail({
                  src: path.resolve(location, entry["originalFileName"]),
                  dst: path.resolve(location, "thumb_" + entry["originalFileName"]),
                  width: 150,
                  height: 150,
                })
              })
              .then((file) => {
                console.log("thumbnail was converted successfully.")
                entry["processedFileNames"] = {}
                entry["processedFileNames"]["thumb"] = "thumb_" + entry["originalFileName"]
                entry["processedFileNames"]["thumb_retina"] = "thumb_retina_" + entry["originalFileName"]

                entry["isProcessed"] = true
                entry.markModified("processedFileNames")
                return entry.save()
              }).then(doc=>{
                console.log("updated item media:")
                console.log(doc)
                done()
              }).catch( err=>{
                done(err)
              }
              )
          } else {
            // another mime types
          }
        })
      } else {
        done()
      }
    })
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

  registerMessageDataPush(userId: string | string[], messageData: MessageData, options: PushOptions = { excludeDeviceIds: [] }) {
    console.log("send synchronization push - " + userId)
    this.agenda.now(C.TASK_PUSH_DATA, { userId: userId, messagePayload: messageData.toMessagingPayloadJson(), options: options }).then(job => {
      console.log("sent push messages successfully.")
    }).catch(err => {
      console.log(err)
    })
  }

  startClientBuildAsync(configId: string, experimentId: string, platform: string, configHash: string): Promise<Job> {
    return this.agenda.now(C.TASK_BUILD_CLIENT_APP, { configId: configId, experimentId: experimentId, platform: platform, configHash: configHash })
  }

  cancelAllBuildJobsOfPlatform(experimentId: string, platform: string): Promise<number> {
    return this.agenda.cancel({ name: C.TASK_BUILD_CLIENT_APP, "data.experimentId": experimentId, "data.platform": platform })
  }
}
