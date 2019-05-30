import { Component, ViewChild, ElementRef, OnDestroy, AfterViewInit } from "@angular/core";
import { ResearchVisualizationQueryConfigurationService, FilteredExperimentDataset } from "../../../services/research-visualization-query-configuration.service";
import { Subscription, Observable } from "rxjs";
import { tap, combineLatest, map } from 'rxjs/operators';
import { ResearchApiService } from "../../../services/research-api.service";
import * as d3 from 'd3';
import * as d3chromatic from 'd3-scale-chromatic';
import { ScaleLinear } from 'd3-scale'
import { Axis } from "d3";
import { IItemDbEntity } from "../../../../../omnitrack/core/db-entity-types";
import * as groupArray from 'group-array';
import { aliasCompareFunc, unique } from "../../../../../shared_lib/utils";

@Component({
  selector: "app-engagement",
  templateUrl: "./engagement.component.html",
  styleUrls: ["./engagement.component.scss"]
})
export class EngagementComponent implements AfterViewInit, OnDestroy{

  constructor(
    private queryConfigService: ResearchVisualizationQueryConfigurationService,
    private api: ResearchApiService
  ) {

    this.dayAxisScale = d3.scaleLinear()
    this.dayAxis = d3.axisTop(this.dayAxisScale)
      .tickSize(0).tickPadding(5)
      .tickFormat((d: number) => d === 0 || (d - Math.floor(d) > 0.01) || (d > this.dayAxisScale.domain()[1] || d <= this.dayAxisScale.domain()[0]) ? null : d.toString())

    this.countAxisScale = d3.scaleLinear().domain([0, 10]).range([0, this.COUNT_CHART_WIDTH])
    this.countAxis = d3.axisTop(this.countAxisScale)
      .tickSize(0).tickPadding(5)

    this.colorScale = d3.scaleLinear<d3.RGBColor, number>().domain([1, this.itemCountRangeMax]).interpolate(d3.interpolateHcl).range([d3.rgb("rgb(243, 220, 117)"), d3.rgb("#2387a0")])

  }

  isBusy = true;

  readonly GLOBAL_PADDING_RIGHT = 8

  readonly X_AXIS_HEIGHT = 20
  readonly Y_AXIS_WIDTH = 120
  readonly TRACKER_NAME_WIDTH = 70

  readonly PARTICIPANT_MARGIN = 6
  readonly TRACKER_MARGIN = 2

  readonly NUM_BLOCKS_PER_DAY = 4

  readonly COUNT_CHART_LEFT_MARGIN = 5
  readonly COUNT_CHART_WIDTH = 120

  readonly PARTICIPANT_MINIMUM_HEIGHT = 20
  readonly TRACKER_ROW_HEIGHT = 20

  readonly trackerColorScale = d3.scaleOrdinal(d3chromatic.schemeCategory10)

  readonly NORMAL_ALIAS_COMPARE = aliasCompareFunc()

  readonly LOG_COUNT_COMPARE = (a: ParticipantRow, b: ParticipantRow) => {
    return d3.sum(b.trackingDataList.map(t => t.itemCountInRange)) - d3.sum(a.trackingDataList.map(t => t.itemCountInRange))
  }

  // tslint:disable-next-line:member-ordering
  readonly SORT_METHODS = [
    {
      label: "Experiment Start",
      sortFunc: (a: ParticipantRow, b: ParticipantRow) => {
        const dateSort = b.daysSinceStart - a.daysSinceStart
        if (dateSort === 0) {
          const countSort = this.LOG_COUNT_COMPARE(a, b)
          if (countSort === 0) {
            return this.NORMAL_ALIAS_COMPARE(a.alias, b.alias)
          } else { return countSort }
        } else { return dateSort }
      }
    },
    {
      label: "Alias",
      sortFunc: (a: ParticipantRow, b: ParticipantRow) => {
        return this.NORMAL_ALIAS_COMPARE(a.alias, b.alias)
      }
    },
    {
      label: "Log Count",
      sortFunc: this.LOG_COUNT_COMPARE
    }
  ]

  public sortMethodIndex = 0

  private readonly _internalSubscriptions = new Subscription();

  public itemCountRangeMax: number = 5

  visualizationAreaHeight = 100

  public hatchPatterns = [
    {
      id: "no-log",
      size: 7,
      pathClass: "no-log-pattern"
    }
  ]

  public dayIndexRange: Array<number>

  @ViewChild("countAxisGroup", {static: false}) countAxisGroup: ElementRef
  @ViewChild("xAxisGroup", {static: false}) xAxisGroup: ElementRef
  @ViewChild("yAxisGroup", {static: false}) yAxisGroup: ElementRef
  @ViewChild("chartMainGroup", {static: false}) chartMainGroup: ElementRef

  public readonly dayAxisScale: ScaleLinear<number, number>
  public readonly dayAxis: Axis<number | { valueOf(): number }>

  public readonly countAxisScale: ScaleLinear<number, number>
  public readonly countAxis: Axis<number | { valueOf(): number }>

  public readonly colorScale: ScaleLinear<d3.RGBColor, string>

  public participantList: Array<ParticipantRow>

  ngAfterViewInit(){


    this._internalSubscriptions.add(
      this.makeDataObservable().pipe(
        tap(data => {
          this.participantList = data.participantList
          this.isBusy = false
        }),
        combineLatest(this.queryConfigService.dayIndexRange().pipe(tap(range => {
          this.dayIndexRange = range
        })), (data, range) => {
          return { data: data, range: range }
        })
      ).subscribe(project => {
        
        // calculate count====================
        let maxItemCount
        const trackerInjectionIds = []
        project.data.participantList.forEach(participantRow => {
          participantRow.trackingDataList.forEach(trackerRow => {

            if (trackerRow.trackerInjectionId && trackerInjectionIds.indexOf(trackerRow.trackerInjectionId) === -1) {
              trackerInjectionIds.push(trackerRow.trackerInjectionId)
            }

            trackerRow.itemCountInRange = trackerRow.itemDayIndices.filter(day => day >= project.range[0] && day <= project.range[1]).length
            if (!maxItemCount) {
              maxItemCount = trackerRow.itemCountInRange
            } else {
              maxItemCount = Math.max(maxItemCount, trackerRow.itemCountInRange)
            }
          })
        })
        // ====================================

        // update axis========================
        this.trackerColorScale.domain(trackerInjectionIds)
        this.countAxisScale.domain([0, maxItemCount]).nice()
        // -------------------------------

        this.onSortMethodChanged(this.sortMethodIndex)
      })
    );
  }

  public trackById(index, obj){
    return obj._id
  }

  public toDarkerColor(color: string): string {
    return d3.hsl(color).darker(2).toString()
  }

  public onSortMethodChanged(index: number) {
    if (this.participantList) {
      this.participantList = this.participantList.slice().sort(this.SORT_METHODS[index].sortFunc)
    }
  }

  public colorLegends(): Array<{ color: string, value: string }> {
    const array = []
    for (let i = 1; i <= this.itemCountRangeMax; i++) {
      array.push({ value: i.toFixed(0), color: this.colorScale(i) })
    }
    array.push({ value: ">" + this.itemCountRangeMax.toFixed(0), color: this.colorScale(this.itemCountRangeMax + 1) })

    return array
  }

  private makeDataObservable(): Observable<EngagementData> {
    return this.queryConfigService.filteredDatesetSubject.pipe(map((dataset: FilteredExperimentDataset) => {
      const data: Array<ParticipantRow> = dataset.data.map(
        participantData => {
          const trackingDataList = participantData.trackingData.map(trackerRow => {
            const grouped = groupArray(trackerRow.decodedItems.map(itemRow => {
              const block = Math.floor(itemRow.dayRatio / (1 / this.NUM_BLOCKS_PER_DAY))
              return { day: itemRow.day, dayRatio: itemRow.dayRatio, block: block, dayAndBlock: itemRow.day + "_" + block, item: itemRow.item }
            }), "dayAndBlock")

            const itemBlocks = []
            for (const dayAndBlock of Object.keys(grouped)) {
              const group = grouped[dayAndBlock]
              const split = dayAndBlock.split("_")
              const day = Number.parseInt(split[0])
              const block = Number.parseInt(split[1])
              itemBlocks.push({ day: day, blockIndex: block, items: group })
            }

            return {
              trackerName: trackerRow.tracker.name.toString(),
              trackerId: trackerRow.tracker._id.toString(),
              trackerInjectionId: trackerRow.tracker.flags.injectionId,
              itemBlocks: itemBlocks,
              itemDayIndices: trackerRow.decodedItems.map(item => item.day),
              itemCountInRange: trackerRow.decodedItems.length
            }
          })

          const noLogDayIndices = []
          for (let i = 0; i < participantData.daySequence.length; i++) {
            if (trackingDataList.find(tracker =>
              tracker.itemBlocks.find(it => it.day === i) != null) == null) {
              noLogDayIndices.push(i)
            }
          }

          return {
            participantId: participantData.participant._id.toString(),
            alias: participantData.participant.participationInfo.alias,
            daysSinceStart: participantData.daySequence.length,
            noLogDayIndices: noLogDayIndices,
            trackingDataList: trackingDataList
          }
        })
      return { earliestExperimentStart: dataset.earliestExperimentStart, maxTotalDays: d3.max(data, (datum) => datum.daysSinceStart), participantList: data }
    }))
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe();
  }

  getFilteredBlocks(trackerRow: TrackerRow): Array<ItemBlockRow>{
    return trackerRow.itemBlocks.filter(b => { return b.day >= this.dayIndexRange[0] && b.day <= this.dayIndexRange[1] })
  }

  getDayIndicesOfTracker(trackerRow: TrackerRow): Array<number>{
    return unique(trackerRow.itemBlocks.map(b => b.day)).filter(b => { return b >= this.dayIndexRange[0] && b <= this.dayIndexRange[1] })
  }

  getDayBlockWidthRatio(): number{
    return 1/(this.dayIndexRange[1] - this.dayIndexRange[0] + 1)
  }

  getDaySequence(): Array<number>{
    return Array.from(new Array(this.dayIndexRange[1] - this.dayIndexRange[0] + 1), (value, index) => { return index + this.dayIndexRange[0] })
  }
}

export interface ItemBlockRow {
  day: number, blockIndex: number, items: Array<IItemDbEntity>
}

export interface TrackerRow {
  trackerName: string,
  trackerId: string,
  trackerInjectionId?: string,
  itemBlocks: Array<ItemBlockRow>,
  itemDayIndices: Array<number>,
  itemCountInRange: number
}

export interface ParticipantRow {
  participantId: string, alias: string, daysSinceStart: number,
  noLogDayIndices: Array<number>, trackingDataList: Array<TrackerRow>
}

export interface EngagementData {
  earliestExperimentStart: number
  maxTotalDays: number, participantList: Array<ParticipantRow>
}
