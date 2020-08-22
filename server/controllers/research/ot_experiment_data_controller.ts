import * as XLSX from 'xlsx';
import OTUser, { USER_PROJECTION_EXCLUDE_CREDENTIAL } from '../../models/ot_user'
import OTTracker from '../../models/ot_tracker'
import OTItem from '../../models/ot_item';
import { experimentCtrl } from './ot_experiment_controller';
import OTExperiment from '../../models/ot_experiment';
import { IExperimentTrackingPlanDbEntity } from '../../../omnitrack/core/research/db-entity-types';
import { IUserDbEntity, IItemDbEntity, IFieldDbEntity } from '../../../omnitrack/core/db-entity-types';
import { TimePoint } from '../../../omnitrack/core/datatypes/field_datatypes';
import FieldManager from '../../../omnitrack/core/fields/field.manager';
import TypedStringSerializer from '../../../omnitrack/core/typed_string_serializer';
import * as moment from 'moment-timezone';
import OTItemMedia from '../../models/ot_item_media';
const snakeCase = require('snake-case');
import * as path from 'path';
import * as fs from 'fs-extra';
import OTUsageLog from '../../models/ot_usage_log';
import * as d3 from 'd3';

enum CellValueType {
  DATETIME_SECONDS = "seconds",
  DATETIME_MINUTES = "minutes",
  DATE = "date",
  CUSTOM = "custom",
  ENUM = "enum"
}

const METADATA_VALUE_TYPE_TABLE = {
  pivotDate: CellValueType.DATE,
  conditionType: CellValueType.ENUM,
  reservedAt: CellValueType.DATETIME_SECONDS,
  actuallyFiredAt: CellValueType.DATETIME_SECONDS,
  screenAccessedAt: CellValueType.DATETIME_SECONDS,
  accessedDirectlyFromReminder: CellValueType.ENUM,
  pairedToReminder: CellValueType.ENUM
}

export class OTExperimentDataCtrl {


  private styleMetadataKeyString(key: string): string {
    return snakeCase(key.replace(/^returned::/g, "")).replace(/_/g, " ")
  }

  private getItemValue(item: IItemDbEntity, attr: IFieldDbEntity, tryFormatted: boolean): any {
    const tableEntry = item.dataTable.find(
      entry => entry.fieldLocalId === attr.localId
    );
    if (tableEntry && tableEntry.sVal != null) {
      const helper = FieldManager.getHelper(attr.type);
      const deserializedValue = TypedStringSerializer.deserialize(
        tableEntry.sVal
      );
      if (helper && tryFormatted === true) {
        const formatted = helper.formatFieldValue(attr, deserializedValue);
        return formatted;
      } else { return deserializedValue; }
    } else { return null; }
  }


  getMetadataCellType(key: string): string {
    return METADATA_VALUE_TYPE_TABLE[key] || CellValueType.CUSTOM
  }

  getMetadataValue(item: IItemDbEntity, metadataKey: string): any {
    if (item.metadata != null) {
      const value = item.metadata[metadataKey]
      if (value != null) {
        switch (this.getMetadataCellType(metadataKey)) {
          case CellValueType.DATE: return new TimePoint(value, item.timezone).toMoment().format("YYYY-MM-DD")
          case CellValueType.DATETIME_MINUTES: return new TimePoint(value, item.timezone).toMoment().format("kk:mm (MMM DD YYYY)") + " " + moment.tz(item.timezone).format("z")
          case CellValueType.DATETIME_SECONDS: return new TimePoint(value, item.timezone).toMoment().format("kk:mm:ss (MMM DD YYYY)") + " " + moment.tz(item.timezone).format("z")
          default: return value
        }
      } else return null
    } else return null
  }

  getItemSourceText(source: string) {
    switch (source) {
      case "Trigger": return "by trigger"
      case "Manual": return "manually"
      default: return "unknown"
    }
  }

  //Data Export=========
  getExperimentDataPacked = async (req, res) => {
    const experimentId = req.params.experimentId
    const researcherId = req.researcher.uid

    if (experimentId != null && researcherId != null) {
      try {

        const experiment = await OTExperiment.findOne(experimentCtrl.makeExperimentAndCorrespondingResearcherQuery(experimentId, researcherId), { "trackingPlans": 1, "groups": 1 }).lean()
        if (experiment != null) {

          console.log("start packing experiment data and media files into an archive.")

          var tmp = require('tmp-promise');
          const tmpDir = await tmp.dir()
          const tmpDirPath = tmpDir.path

          const plans: Array<IExperimentTrackingPlanDbEntity> = experiment["trackingPlans"]
          const planSheets = new Array<XLSX.WorkBook>()

          for (const plan of plans) {
            console.log("start gathering plan " + plan.name + "...")
            //make table per plan
            const commonColumns = ["item_id", "item_order", "participant_alias", "group"]

            const workbook = XLSX.utils.book_new()

            for (const trackerSchema of plan.data.trackers) {
              // Per tracker plan
              console.log("gather data for tracker " + trackerSchema.name)

              const injectedAttrNames = trackerSchema.fields.map(attr => attr.name)
              const metadataColumns = []

              const trackers = await OTTracker.find({ "flags.injectionId": trackerSchema.flags.injectionId }).lean<any>()

              for (const tracker of trackers) {
                const items = await OTItem.find({ "tracker": tracker._id })

                // Find metadataColumns
                items.forEach(item => {
                  if (item["metadata"] != null) {
                    for (const key of Object.keys(item["metadata"])) {
                      if (metadataColumns.indexOf(key) === -1) {
                        metadataColumns.push(key)
                      }
                    }
                  }
                })
              }

              const itemRows: Array<Array<any>> = [
                commonColumns.concat(injectedAttrNames).concat(["logged at", "captured", "est_session_duration"]).concat(metadataColumns.map(c => this.styleMetadataKeyString(c)))
              ]

              for (const tracker of trackers) {
                const participant = await OTUser.findOne({ "_id": tracker.user }, USER_PROJECTION_EXCLUDE_CREDENTIAL).lean<IUserDbEntity>()
                if (participant != null) {

                  console.log("gather data for participant " + participant.participationInfo.alias + "...")

                  const group = experiment["groups"].find(group => group._id === participant.participationInfo.groupId)
                  const items = await OTItem.find({ "tracker": tracker._id }).lean<Array<IItemDbEntity>>()
                  const itemTrackSessionLogs: Array<any> = await OTUsageLog.find({ "content.session": "kr.ac.snu.hcil.omnitrack.ui.pages.items.NewItemActivity", "content.item_saved": true, "experiment": experimentId, "user": participant._id }).lean()

                  console.log("Start gathering " + items.length + " items...")
                  //find metadataColumns
                  for (const item of items) {
                    const values = trackerSchema.fields.map(attrScheme => {
                      const attr = tracker.fields.find(a => (a.flags || {}).injectionId === attrScheme.flags.injectionId)
                      return attr != null ? this.getItemValue(item, attr, true) : null
                    })

                    const itemOrder = items.indexOf(item)

                    //calculate session duration

                    const closeSessions = itemTrackSessionLogs.filter(l => Math.abs(l.content.finishedAt - item.timestamp) < 1000)
                    let sessionDuration = null;
                    if (closeSessions.length > 1) {
                      console.log("Multiple close sessions : ", closeSessions.length)
                      sessionDuration = d3.sum(closeSessions, s => s.content.elapsed)
                    } else if (closeSessions.length === 1) {
                      sessionDuration = d3.sum(closeSessions, s => s.content.elapsed)
                    } else {
                      //no session
                      console.log("No close sessions.")
                    }

                    //==========================

                    itemRows.push(
                      [item._id, itemOrder, participant.participationInfo.alias, group != null ? group.name : null]
                        .concat(values)
                        .concat([
                          new TimePoint(item.timestamp, item.timezone).toMoment().format(),
                          this.getItemSourceText(item.source),
                          sessionDuration
                        ]
                          .concat(metadataColumns.map(m => this.getMetadataValue(item, m)))
                        )
                    )

                    for (const attrScheme of trackerSchema.fields) {
                      const attr = tracker.fields.find(a => (a.flags || {}).injectionId === attrScheme.flags.injectionId)

                      const helper = FieldManager.getHelper(attr.type);

                      if (helper.typeNameForSerialization === TypedStringSerializer.TYPENAME_SERVERFILE) {
                        //media file
                        const fileName = attr != null ? this.getItemValue(item, attr, true) : null
                        if (fileName != null) {
                          //file exists
                          const media = await OTItemMedia.findOne({
                            tracker: tracker._id,
                            fieldLocalId: attr.localId,
                            item: item._id
                          }).lean<any>()
                          if (media) {
                            const mediaFilePath = req.app.get("omnitrack").serverModule.makeItemMediaFileDirectoryPath(media.user, tracker._id, item._id) + "/" + media.originalFileName
                            const mediaTempDirectoryPath = (participant.participationInfo.alias || participant._id) + "/" + snakeCase(tracker.name) + "/" + itemOrder
                            const mediaTempFileName = fileName + path.extname(media.originalFileName)

                            await fs.ensureDir(mediaTempDirectoryPath)
                            await fs.copy(mediaFilePath, path.join(tmpDirPath, mediaTempDirectoryPath, mediaTempFileName))
                            console.log("copied media file")
                          } else {
                            console.log("media DB entry does not exist - check the original path: ", req.app.get("omnitrack").serverModule.makeItemMediaFileDirectoryPath(participant._id, tracker._id, item._id))
                          }
                        } else {
                          console.log("media item value does not exist.")
                        }
                      }
                    }

                    console.log("Done item " + "(" + itemOrder + ") " + item._id)
                  }

                  console.log("End gathering data for participant " + participant.participationInfo.alias)
                }
              }

              const sheet = XLSX.utils.aoa_to_sheet(itemRows)
              XLSX.utils.book_append_sheet(workbook, sheet, trackerSchema.name)

              console.log("End gathering data for tracker " + trackerSchema.name)
            }

            await XLSX.writeFile(workbook, path.join(tmpDirPath, "data_" + plan.name + ".xlsx"), {
              bookType: 'xlsx', bookSST: false, type: 'array'
            })
          }

          console.log(tmpDirPath)

          const zipper = require('bestzip')

          const zipFilePath = (await tmp.file()).path + ".zip"

          console.log(zipFilePath)

          await zipper({
            source: "./",
            destination: zipFilePath,
            cwd: tmpDirPath
          })

          fs.removeSync(tmpDirPath)
          res.download(zipFilePath, "exported_experiment_dataset.zip", (err) => {
            if (err) {
              console.error("experiment data archive send error")
              console.error(err)
            } else {
              console.log("successfully sent an experiment zip.")
            }
          })


        } else {
          res.status(404).send("No such experiment")
        }
      } catch (ex) {
        console.error(ex)
        res.status(500).send(ex)
      }

    } else {
      res.status(404).send("experiment id or researcher id were not submitted.")
    }
  }


  getExperimentItemSessionDurations = async (req, res) => {
    const experimentId = req.params.experimentId
    const experiment = await OTExperiment.findOne({ _id: experimentId }, { "trackingPlans": 1, "groups": 1 }).lean()

    if (experiment != null) {
      const plans: Array<IExperimentTrackingPlanDbEntity> = experiment["trackingPlans"]
      const planSheets = new Array<XLSX.WorkBook>()

      for (const plan of plans) {

        for (const trackerSchema of plan.data.trackers) {
          // Per tracker plan

          const trackers = await OTTracker.find({ "flags.injectionId": trackerSchema.flags.injectionId }).lean<any>()

          for (const tracker of trackers) {

            const participant = await OTUser.findOne({ "_id": tracker.user }, USER_PROJECTION_EXCLUDE_CREDENTIAL).lean<IUserDbEntity>()
            if (participant != null) {

              const group = experiment["groups"].find(group => group._id === participant.participationInfo.groupId)
              const items = await OTItem.find({ "tracker": tracker._id }, { timestamp: 1 }).lean<Array<IItemDbEntity>>()

              const itemTrackSessionLogs: Array<any> = await OTUsageLog.find({ "content.session": "kr.ac.snu.hcil.omnitrack.ui.pages.items.NewItemActivity", "content.item_saved": true, "experiment": experimentId, "user": participant._id }).lean()

              const itemsWithMatchedSessions = items.map(item => {

                const closeSessions = itemTrackSessionLogs.filter(l => Math.abs(l.content.finishedAt - item.timestamp) < 1000)
                if (closeSessions.length > 1) {
                  console.log("Multiple close sessions : ", closeSessions.length)
                  return { itemTimestamp: item.timestamp, sessions: closeSessions.map(s => ({ duration: s.content.elapsed, finishedAt: s.content.finishedAt })) }
                } else if (closeSessions.length === 1) {
                  return { itemTimestamp: item.timestamp, sessions: closeSessions.map(s => ({ duration: s.content.elapsed, finishedAt: s.content.finishedAt })) }
                } else {
                  //no session
                  console.log("No close sessions.")
                  return { itemTimestamp: item.timestamp, sessions: closeSessions.map(s => ({ duration: s.content.elapsed, finishedAt: s.content.finishedAt })) }
                }
              })

              console.log(participant.participationInfo.alias)
              console.log(itemsWithMatchedSessions)
            }

          }
        }
      }
    } else {
      res.status(404).send("No such experiment.")
    }

  }

}

const experimentDataCtrl = new OTExperimentDataCtrl()
export { experimentDataCtrl }
