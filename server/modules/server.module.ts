
import OTItemMedia from '../models/ot_item_media';
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
import { experimentCtrl } from '../controllers/research/ot_experiment_controller';
import OTTracker from '../models/ot_tracker';
import OTItem from '../models/ot_item';

export default class ServerModule {

  readonly agenda: Agenda

  constructor() {
    let mongoDbUri: string
    if (env.node_env === 'test') {
      mongoDbUri = env.mongodb_agenda_test_uri
    } else {
      mongoDbUri = env.mongodb_agenda_uri
    }

    this.agenda = new Agenda({ db: { address: mongoDbUri, options: { useNewUrlParser: true } } })
  }

  bootstrap() {
    console.log("bootstrapping a server module...")
    try {

      //handle super users
      OTResearcher.updateMany({ email: { $in: env.super_users }, account_approved: { $ne: true } }, { account_approved: true }).then((updated) => {
        console.log(updated.nModified + " researchers became new superuser.")
      }).catch(err => {
        console.log(err)
      })

      OTTracker.collection.updateMany({}, {'$rename': {"attributes": "fields"}}).then(updated => {
        console.log("renamed tracker attributes to fields.")
      })

      OTItem.find({}).then(items => {
        return Promise.all(items.map(item => {
          (item as any).dataTable.forEach( entry => {
            entry.fieldLocalId = entry.attrLocalId
            delete entry.attrLocalId
          })
          item.markModified("dataTable")
          return item.save()
        }))
      }).then(updated => {
        console.log("renamed item entry attrLocalId to fieldLocalId.")
      })

    } catch (err) {

    }

    this.agenda.on('ready', () => {
      console.log("agenda is ready.")
      this.defineItemMediaPostProcessAgenda()
      this.defineDataMessagePushAgenda()
      this.defineBuildClientAppAgenda()

      this.agenda.start()
    })

    const notifyBuildStatus = (status: ClientBuildStatus, experimentId?: string) => {
      if (experimentId != null) {
        experimentCtrl.getResearcherInfosOfExperiment(experimentId).then(
          infos => {
            infos.forEach(info => {
              appWrapper.socketModule().sendDataToResearcherSubscribers(info.id, SocketConstants.SOCKET_MESSAGE_CLIENT_BUILD_STATUS, status)
            })
          }
        )
      } else {
        appWrapper.socketModule().sendDataToGlobalSubscribers(SocketConstants.SOCKET_MESSAGE_CLIENT_BUILD_STATUS, status)
      }
    }

    this.agenda.on('start:' + C.TASK_BUILD_CLIENT_APP, (job) => {
      const statusBase: ClientBuildStatus = {
        experimentId: job.attrs.data.experimentId,
        researcherMode: job.attrs.data.researcherMode,
        jobId: job.attrs._id,
        platform: job.attrs.data.platform,
        configId: job.attrs.data.configId,
        status: EClientBuildStatus.BUILDING
      }

      notifyBuildStatus(statusBase, job.attrs.data.experimentId)

      new OTClientBuildAction({
        experiment: job.attrs.data.experimentId,
        researcherMode: job.attrs.data.researcherMode,
        platform: job.attrs.data.platform,
        config: job.attrs.data.configId,
        configHash: job.attrs.data.configHash,
        jobId: job.attrs._id
      } as any).save().then(
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
        researcherMode: job.attrs.data.researcherMode,
        jobId: job.attrs._id,
        platform: job.attrs.data.platform,
        configId: job.attrs.data.configId,
        status: EClientBuildStatus.SUCCEEDED
      }
      notifyBuildStatus(statusBase, job.attrs.data.experimentId)
    })

    this.agenda.on('fail:' + C.TASK_BUILD_CLIENT_APP, (err, job) => {
      const isCanceled = err.message === "BuildCanceledExternally" || err.code === 143

      const status = isCanceled === true ? EClientBuildStatus.CANCELED : EClientBuildStatus.FAILED

      const statusBase: ClientBuildStatus = {
        experimentId: job.attrs.data.experimentId,
        researcherMode: job.attrs.data.researcherMode,
        jobId: job.attrs._id,
        platform: job.attrs.data.platform,
        configId: job.attrs.data.configId,
        status: status,
        error: isCanceled === true ? err : null
      }

      notifyBuildStatus(statusBase, job.attrs.data.experimentId)

      OTClientBuildAction.updateOne(
        { jobId: job.attrs._id },
        {
          finishedAt: new Date(),
          result: status,
          lastError: isCanceled === true ? err : null
        }
      ).then((saved) => {
        if (saved.nModified > 0) {
          console.log("Aborted a client build action. -", status)
        }
      }).catch(e => {
        console.error(e)
      })
    })

    this.agenda.on('error', (err) => {
      console.error(err)
      console.error("Error type: ", typeof err)
      console.log("error.message:", err.message)
      console.log("lost mongo connection. refresh aganda")
      this.agenda.start()
    })
  }

  private defineBuildClientAppAgenda() {
    this.agenda.define(C.TASK_BUILD_CLIENT_APP, (job, done) => {
      const experimentId = job.attrs.data.experimentId
      const configId = job.attrs.data.configId

      console.log("start build app.")
      if ((!experimentId && job.attrs.data.researcherMode === false) || !configId) {
        const err = new Error("did not provide proper arguments.")
        return done(err)
      }

      this.cancelAllBuildJobsOfPlatform(job.attrs.data.experimentId, job.attrs.data.platform, job.attrs._id).then(numCanceled => {
        console.log("canceled", numCanceled, "pending build jobs. start mine.")
        clientBuildCtrl._build(configId, experimentId, (pid) => {
          //new process was spawned
          return OTClientBuildAction.updateOne({ jobId: job.attrs._id }, {
            $addToSet: { pids: pid }
          }).exec()
        }, () => {
          return OTClientBuildAction.findOne({
            jobId: job.attrs._id,
            finishedAt: { $ne: null }
          }, { _id: 1 }).countDocuments().then(count => count > 0)
        }).then(
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
              }).then(doc => {
                console.log("updated item media:")
                console.log(doc)
                done()
              }).catch(err => {
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
    return this.makeUserMediaDirectoryPath(userId) + "/" + trackerId + "/" + itemId
  }

  makeUserMediaDirectoryPath(userId: string): string {
    return "storage/uploads/users/" + userId
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
    console.log("send data message push - " + userId)
    this.agenda.now(C.TASK_PUSH_DATA, { userId: userId, messagePayload: messageData.toMessagingPayloadJson(), options: options }).then(job => {
      console.log("sent push messages successfully.")
    }).catch(err => {
      console.log(err)
    })
  }

  startClientBuildAsync(configId: string, experimentId: string, platform: string, configHash: string): Promise<Job> {
    return this.agenda.now(C.TASK_BUILD_CLIENT_APP, { configId: configId, experimentId: experimentId, researcherMode: experimentId ? false : true, platform: platform, configHash: configHash })
  }

  cancelAllBuildJobsOfPlatform(experimentId: string, platform: string, excludeJobId?: any): Promise<number> {
    const value = { name: C.TASK_BUILD_CLIENT_APP, "data.platform": platform }
    if (experimentId != null) {
      value["data.experimentId"] = experimentId
    } else value["data.researcherMode"] = true

    if (excludeJobId != null) {
      value["_id"] = { $ne: excludeJobId }
    }

    return this.agenda.jobs(value).then(jobs => {
      if (jobs.length > 0) {
        return Promise.all(jobs.map(job => job.remove())).then(() => {
          return OTClientBuildAction.find({ jobId: { $in: jobs.map(job => job.attrs._id) } }, {
            _id: 1,
            pids: 1
          }).lean().then(actions => {
            console.log("actions:", actions)
            if (actions.length > 0) {
              const pids = []
              for (const action of actions) {
                if (action.pids) {
                  for (const pid of action.pids) {
                    if (pids.indexOf(pid) === -1) {
                      pids.push(pid)
                    }
                  }
                }
              }
              console.log("PIDs to kill: ", pids.join(", "))
              if (pids.length > 0) {
                const treeKill = require('tree-kill');
                pids.forEach(pid => treeKill(pid))
              }

              return OTClientBuildAction.updateMany({
                _id: { $in: actions.map(a => a._id) }
              }, {
                  finishedAt: new Date(),
                  result: 'canceled'
                }).then(r => {
                  console.log("updated buildActions:", r)
                  return r.n
                })
            } else return 0
          })
        })
      } else return 0
    })

    /*
    return this.agenda.cancel(value).then(numCanceled => {
      console.log("jobs to cancel:", numCanceled)
      const actionQuery = { platform: platform, finishedAt: null }
      if (experimentId != null) {
        actionQuery["experimentId"] = experimentId
      } else actionQuery["researcherMode"] = true

      console.log("actionQuery:", actionQuery)
      return OTClientBuildAction.find(actionQuery, {
        _id: 1,
        pids: 1
      }).lean().then(actions => {
        console.log("actions:", actions)
        if (actions.length > 0) {
          const pids = []
          for (const action of actions) {
            if (action.pids) {
              for (const pid of action.pids) {
                if (pids.indexOf(pid) === -1) {
                  pids.push(pid)
                }
              }
            }
          }
          console.log("PIDs to kill: ", pids.join(", "))
          if (pids.length > 0) {
            const treeKill = require('tree-kill');
            pids.forEach(pid => treeKill(pid))
          }
          return OTClientBuildAction.updateMany({
            _id: { $in: actions.map(a => a._id) }
          }, {
              finishedAt: new Date(),
              result: 'canceled'
            }).then(r => {
              console.log("updated buildActions:", r)
              return r.n
            })
        } else return 0
      })
    })*/
  }
}
