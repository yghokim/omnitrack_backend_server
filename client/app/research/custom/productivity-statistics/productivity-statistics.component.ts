import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../../../services/research-api.service';
import { Subscription } from 'rxjs/Subscription';
import { TrackingSet, ProductivityHelper, DecodedItem, ProductivityLog } from '../../../shared-visualization/custom/productivity-helper';
import { ITrackerDbEntity, IItemDbEntity, IParticipantDbEntity, ISessionUsageLog } from '../../../../../omnitrack/core/db-entity-types';
import 'rxjs/add/operator/combineLatest';
import { groupArrayByVariable, deepclone } from '../../../../../shared_lib/utils';
import { getExperimentDateSequenceOfParticipant, convertUsageLogToSessionLog } from '../../../../../omnitrack/experiment-utils';
import { ProductivitySummaryService } from './productivity-summary.service';
import * as moment from 'moment';
import * as d3 from 'd3';
import * as json2csv from 'json2csv';
import * as FileSaver from 'file-saver';
let JSZip = require("jszip");

@Component({
  selector: 'app-productivity-statistics',
  templateUrl: './productivity-statistics.component.html',
  styleUrls: ['./productivity-statistics.component.scss'],
  providers: [ProductivitySummaryService]
})
export class ProductivityStatisticsComponent implements OnInit, OnDestroy {

  public get productivityColorScale(): any {
    return ProductivityHelper.productivityColorScale
  }

  public isBusy = true

  public excludedParticipantIds: Array<string> = []

  private _internalSubscriptions = new Subscription()

  private fullDateSequencesPerUser: Map<string, Array<moment.Moment>> = new Map()

  public participantPool: Array<IParticipantDbEntity>
  public selectedParticipants: Array<IParticipantDbEntity>

  public decodedItems: Array<DecodedItem>
  public productivityLogs: Array<ProductivityLog>
  public decodedItemsPerParticipant: Array<{ participant: any, decodedItems: Array<DecodedItem>, weekdayLogs: Array<DecodedItem>, weekendLogs: Array<DecodedItem> }>

  public excludedDecodedItems: Map<string, Array<DecodedItem>> = new Map()

  public excludedItemCountInfo: Array<{ reason: string, count: number }> = []

  public sessionLogDict: Array<{ user: string, logs: Array<ISessionUsageLog> }>

  public set trackingSets(newSet: Array<TrackingSet>) {
    this.decodedItems = []
    this.productivityLogs = []

    this.excludedDecodedItems.clear()

    newSet.forEach(trackingSet => {
      const processed = ProductivityHelper.processTrackingSet(trackingSet)
      this.decodedItems = this.decodedItems.concat(processed.decodedItems)
      this.productivityLogs = this.productivityLogs.concat(processed.productivityLogs)
    })

    this.onUpdateData(this.participantPool, this.decodedItems, this.productivityLogs)
  }

  public trackerPool: Array<ITrackerDbEntity>
  public itemPool: Array<IItemDbEntity>

  constructor(private api: ResearchApiService, public productivitySummary: ProductivitySummaryService) {

    if (localStorage.getItem("excludedParticipantIds")) {
      this.excludedParticipantIds = JSON.parse(localStorage.getItem("excludedParticipantIds"))
    }

    this._internalSubscriptions.add(
      this.api.selectedExperimentService.subscribe(service => {
        service.trackingDataService.registerConsumer("ExperimentCustomStatisticsComponent")
      })
    )

    this._internalSubscriptions.add(
      this.api.selectedExperimentService.flatMap(expService => expService.getParticipants()).subscribe(
        participants => {
          this.participantPool = participants
          this.selectedParticipants = participants.filter(p => this.excludedParticipantIds.indexOf(p._id) === -1)
          this.onParticipantListChanged(this.selectedParticipants)
        }
      )
    )

    this._internalSubscriptions.add(
      this.api.selectedExperimentService.flatMap(expService => {
        return expService.trackingDataService.trackers.combineLatest(
          expService.trackingDataService.items, (trackers, items) => {
            console.log("loaded items")
            return { trackers: trackers, items: items }
          }
        )
      }).subscribe(
        set => {
          console.log("received trackingSets")
          this.trackingSets = set.trackers.filter(tracker => ProductivityHelper.isProductivityTracker(tracker) === true).map(
            tracker => {
              const omitLogTracker = set.trackers.find(t => t.user === tracker.user && ProductivityHelper.isOmitLogTracker(t) === true)

              return { tracker: tracker, items: set.items.filter(item => item.tracker === tracker._id), omitLogTracker: omitLogTracker, omitLogs: omitLogTracker ? set.items.filter(i => i.tracker === omitLogTracker._id) : [] }
            }
          )
        }
      )
    )

    this._internalSubscriptions.add(
      this.api.selectedExperimentService.flatMap(expService => expService.queryUsageLogsPerParticipant({
        name: "session",
        "$or": ["ChartViewActivity", "ItemBrowserActivity", "ItemDetailActivity"].map(name => {
          return {
            "content.session": { "$regex": name, "$options": "i" }
          }
        })
      })).subscribe(
        result => {
          result.forEach(e => {
            e.logs.forEach(l => {
              convertUsageLogToSessionLog(l)
            })
          })
          this.sessionLogDict = result as any
        }
      )
    )
  }

  ngOnInit() {
  }

  onSortClick(columnName: string) {
    this.productivitySummary.sortBy(columnName, false)
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
    if (this.api.selectedExperimentServiceSync) {
      this.api.selectedExperimentServiceSync.trackingDataService.unregisterConsumer("ExperimentCustomStatisticsComponent")
    }

    localStorage.setItem("excludedParticipantIds", JSON.stringify(this.excludedParticipantIds))
  }

  private onUpdateData(participants: Array<any>, decodedItems: Array<DecodedItem>, productivityLogs: Array<ProductivityLog>) {

    console.log("onUpdateData")
    if (participants && decodedItems && productivityLogs) {

      const filteredDecodedItems = []
      const filteredProductivityLogs = []

      if (decodedItems) {
        for (const item of decodedItems) {
          if (participants.find(p => p.user._id === item.user)) {
            const sequence = this.fullDateSequencesPerUser.get(item.user)
            if (sequence) {
              const dateIndex = sequence.findIndex(d => d.isSame(moment(item.from), 'day'))

              if (dateIndex > 13) {
                if (this.excludedDecodedItems.has("Out of Experiment Range") === false) {
                  this.excludedDecodedItems.set("Out of Experiment Range", [])
                }
                this.excludedDecodedItems.get("Out of Experiment Range").push(item)
                continue
              }

              if (item.tasks.indexOf("수면") !== -1) {
                if (this.excludedDecodedItems.has("Sleep") === false) {
                  this.excludedDecodedItems.set("Sleep", [])
                }
                this.excludedDecodedItems.get("Sleep").push(item)
                continue
              }

              filteredDecodedItems.push(item)
            }
          }
        }
      }

      if (productivityLogs) {
        for (const log of productivityLogs) {
          const sequence = this.fullDateSequencesPerUser.get(log.user)
          if (sequence) {
            const dateIndex = sequence.findIndex(d => d.isSame(moment(log.dateStart), 'day'))
            if (dateIndex > 13) {
              continue
            }

            if (log.decodedItem.tasks.indexOf("수면") !== -1) {
              continue
            }

            filteredProductivityLogs.push(log)
          }
        }
      }

      this.decodedItems = filteredDecodedItems
      this.productivityLogs = filteredProductivityLogs

      this.excludedItemCountInfo = Array.from(this.excludedDecodedItems.entries()).map(entry => {
        return { reason: entry[0], count: entry[1].length }
      })

      const grouped = groupArrayByVariable(filteredDecodedItems, "user")
      const arrayed = []
      for (const userId of Object.keys(grouped)) {
        const participant = participants.find(p => p.user._id === userId)
        if (participant) {
          const items: Array<DecodedItem> = grouped[userId]
          arrayed.push({
            participant: participant,
            decodedItems: items,
            weekdayLogs: items.filter(item => moment(item.dominantDate).isoWeekday() < 6),
            weekendLogs: items.filter(item => moment(item.dominantDate).isoWeekday() >= 6)
          })
        }
      }

      arrayed.sort((a, b) => a.decodedItems.length - b.decodedItems.length)

      if (arrayed.length > 0) {
        this.productivitySummary.upsertColumn({
          columnName: "Total Logs",
          order: 0,
          rows: arrayed.map(entry => ({ participant: entry.participant, value: entry.decodedItems.length, type: "number" })),
          summary: this.productivitySummary.makeStatisticsSummaryHtmlContent(arrayed, (entry) => entry.decodedItems.length, (value) => value.toFixed(2), null, true),
          normalizedRange: [0, d3.max(arrayed, elm => elm.decodedItems.length)]
        })

        this.productivitySummary.upsertColumn({
          columnName: "Weekday Logs",
          order: 0,
          rows: arrayed.map(entry => ({ participant: entry.participant, value: entry.weekdayLogs.length, type: "number" })),
          summary: this.productivitySummary.makeStatisticsSummaryHtmlContent(arrayed, (entry) => entry.weekdayLogs.length, (value) => value.toFixed(2), null, true),
          normalizedRange: [0, d3.max(arrayed, elm => elm.weekdayLogs.length)]
        })

        this.productivitySummary.upsertColumn({
          columnName: "Weekend Logs",
          order: 0,
          rows: arrayed.map(entry => ({ participant: entry.participant, value: entry.weekendLogs.length, type: "number" })),
          summary: this.productivitySummary.makeStatisticsSummaryHtmlContent(arrayed, (entry) => entry.weekendLogs.length, (value) => value.toFixed(2), null, true),
          normalizedRange: [0, d3.max(arrayed, elm => elm.weekendLogs.length)]
        })
      }

      this.decodedItemsPerParticipant = arrayed

      this.isBusy = false
    } else {
      console.log("participants are null. skip")
    }
  }

  private onParticipantListChanged(participants: Array<any>) {
    this.fullDateSequencesPerUser.clear()
    participants.forEach(participant => {
      const dateSequence = getExperimentDateSequenceOfParticipant(participant, new Date(), true)
      this.fullDateSequencesPerUser.set(participant.user._id, dateSequence.map(d => moment(d)))
    })

    this.productivitySummary.setParticipants(participants)

    this.onUpdateData(participants, this.decodedItems, this.productivityLogs)
  }

  public onExcludedParticipantSelectionChanged($event) {
    this.selectedParticipants = this.participantPool.filter(p => this.excludedParticipantIds.indexOf(p._id) === -1)
    this.onParticipantListChanged(this.selectedParticipants)
  }

  private calcStatisticsPerParticipant(field: string): { mean: number, sd: number, sum: number, min: number, max: number } {
    const fieldCounts = this.decodedItemsPerParticipant.map(r => r[field].length)
    return { mean: d3.mean(fieldCounts), sd: d3.deviation(fieldCounts), sum: d3.sum(fieldCounts), min: d3.min(fieldCounts), max: d3.max(fieldCounts) }
  }

  private onExportClicked() {
    const tableJson = this.productivitySummary.exportToJsonTable()
    const tableParser = new json2csv.Parser();
    const tableCsv = tableParser.parse(tableJson)
    /*
        user: string;
        productivity: number;
        duration: number;
        from: number;
        to: number;
        timestampDayRatio: number,
        usedDevices: Array<string>;
        tasks: Array<string>;
        location: string;
        rationale: string;
        mood?: number,
        photo?: ServerFile,
        dominantDate: Date;
        dominantDateNumber: number;
        item: IItemDbEntity;*/

    const decodedItemsJson: Array<any> = []
    this.decodedItemsPerParticipant.forEach(participantRow => {
      const sequence = getExperimentDateSequenceOfParticipant(participantRow.participant, new Date(), true)
      console.log("sequence of " + participantRow.participant.alias)
      console.log(sequence)

      const items = participantRow.decodedItems.map(item => {
        const json = deepclone(item)
        json["participant"] = participantRow.participant.alias
        json["used_devices"] = json.usedDevices ? json.usedDevices.join(" | ") : null
        json["tasks"] = json.tasks ? json.tasks.join(" | ") : null

        json["delay_millis"] = json.from > json.item.timestamp ? json.from - json.item.timestamp : (json.to < json.item.timestamp ? (json.item.timestamp - json.to) : 0)

        json["from"] = moment(json["from"]).format()
        json["to"] = moment(json["to"]).format()
        json["dominantDate"] = moment(json["dominantDateNumber"]).format()
        json["timestamp"] = moment(json.item.timestamp).format()
        json["photo_exists"] = json["photo"] ? true : false
        json["is_weekday"] = moment(json.dominantDateNumber).isoWeekday() < 6
        json["experimental_day"] = sequence.findIndex(s => moment(s).isSame(moment(json.dominantDateNumber).format("YYYY-MM-DD"), 'days') === true)

        delete json["user"]
        delete json["item"]
        delete json["photo"]
        delete json["usedDevices"]
        delete json["dominantDateNumber"]
        return json
      })

      items.forEach(i => decodedItemsJson.push(i))
    })

    const itemTableParser = new json2csv.Parser();

    const decodedItemsCsv = itemTableParser.parse(decodedItemsJson)

    const zip = new JSZip()
    zip.file("omnitrack-per-participant-table.csv", tableCsv)
    zip.file("omnitrack-decoded-items.csv", decodedItemsCsv)
    zip.generateAsync({ type: "blob" }).then(blob => {
      FileSaver.saveAs(blob, "productivity-experiment-data.zip");
    })

  }
}
