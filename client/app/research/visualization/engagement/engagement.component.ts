import { Component, ViewChild, ElementRef, Input, OnInit, AfterViewInit, OnDestroy, Directive, ViewChildren, QueryList } from "@angular/core";
import { VisualizationBaseComponent } from "../visualization-base.component";
import { ResearchVisualizationQueryConfigurationService, Scope, FilteredExperimentDataset } from "../../../services/research-visualization-query-configuration.service";
import { Subscription, Observable, Subject } from "rxjs";
import { tap, combineLatest, map } from 'rxjs/operators';
import { TrackingDataService } from '../../../services/tracking-data.service';
import { ResearchApiService } from "../../../services/research-api.service";
import { NO_ERRORS_SCHEMA } from '@angular/core';
import * as d3 from 'd3';
import * as d3chromatic from 'd3-scale-chromatic';
import { ScaleLinear } from 'd3-scale'
import { D3VisualizationBaseComponent } from "../d3-visualization-base.component";
import { ScaleOrdinal, Axis } from "d3";
import * as moment from "moment";
import { IItemDbEntity } from "../../../../../omnitrack/core/db-entity-types";
import { EngagementTimelineContainerDirective } from "./engagement-timeline-container.directive";
import * as groupArray from 'group-array';
import { Moment } from "moment-timezone";
import { diffDaysBetweenTwoMoments, aliasCompareFunc } from "../../../../../shared_lib/utils";

@Component({
  selector: "app-engagement",
  templateUrl: "./engagement.component.html",
  styleUrls: ["./engagement.component.scss"]
})
export class EngagementComponent extends D3VisualizationBaseComponent<
EngagementData
> implements OnInit, OnDestroy {

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

  readonly visualizationWidth = new Subject<number>();
  public timelineChartArea = { width: 0, x: this.Y_AXIS_WIDTH }
  public countChartArea = { width: this.COUNT_CHART_WIDTH, x: 0 }

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

  @ViewChild("countAxisGroup") countAxisGroup: ElementRef
  @ViewChild("xAxisGroup") xAxisGroup: ElementRef
  @ViewChild("yAxisGroup") yAxisGroup: ElementRef
  @ViewChild("chartMainGroup") chartMainGroup: ElementRef

  public readonly dayAxisScale: ScaleLinear<number, number>
  public readonly dayAxis: Axis<number | { valueOf(): number }>

  public readonly countAxisScale: ScaleLinear<number, number>
  public readonly countAxis: Axis<number | { valueOf(): number }>

  public readonly colorScale: ScaleLinear<d3.RGBColor, string>

  constructor(
    private queryConfigService: ResearchVisualizationQueryConfigurationService,
    private api: ResearchApiService
  ) {
    super();

    this.dayAxisScale = d3.scaleLinear()
    this.dayAxis = d3.axisTop(this.dayAxisScale)
      .tickSize(0).tickPadding(5)
      .tickFormat((d: number) => d === 0 || (d - Math.floor(d) > 0.01) || (d > this.dayAxisScale.domain()[1] || d <= this.dayAxisScale.domain()[0]) ? null : d.toString())

    this.countAxisScale = d3.scaleLinear().domain([0, 10]).range([0, this.COUNT_CHART_WIDTH])
    this.countAxis = d3.axisTop(this.countAxisScale)
      .tickSize(0).tickPadding(5)

    this.colorScale = d3.scaleLinear<d3.RGBColor, number>().domain([1, this.itemCountRangeMax]).interpolate(d3.interpolateHcl).range([d3.rgb("rgb(243, 220, 117)"), d3.rgb("#2387a0")])

  }

  ngOnInit() {

    // init visualization

    this._internalSubscriptions.add(
      this.makeDataObservable().pipe(
        tap(data => {
          this.data = data
          this.isBusy = false
        }),
        combineLatest(this.queryConfigService.dayIndexRange().pipe(tap(range => {
          this.dayIndexRange = range
        })), this.visualizationWidth, (data, range, width) => {
          return { data: data, range: range, width: width }
        })
      ).subscribe(project => {
        this.timelineChartArea.width = project.width - this.Y_AXIS_WIDTH - this.COUNT_CHART_WIDTH - this.COUNT_CHART_LEFT_MARGIN - this.GLOBAL_PADDING_RIGHT

        this.countChartArea.x = this.timelineChartArea.x + this.timelineChartArea.width + this.COUNT_CHART_LEFT_MARGIN

        // calculate height================
        if (project.data.participantList.length > 0) {
          const participantsWithTrackerHeightTotal = project.data.participantList.map(p => this.calcHeightOfParticipantRow(p)).reduce((a, b) => a + b)
          const numZeroTrackerParticipants = project.data.participantList.filter(p => p.trackingDataList.length === 0).length
          this.visualizationAreaHeight = participantsWithTrackerHeightTotal + numZeroTrackerParticipants * this.PARTICIPANT_MINIMUM_HEIGHT + this.X_AXIS_HEIGHT + Math.max(0, (project.data.participantList.length - 1)) * this.PARTICIPANT_MARGIN
        } else {
          this.visualizationAreaHeight = 0
        }
        // -----------------------------

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

        this.dayAxisScale.domain([project.range[0], project.range[1] + 1]).range([0, this.timelineChartArea.width])
        d3.select(this.xAxisGroup.nativeElement)
          .transition()
          .duration(500)
          .call(this.dayAxis).call(
            (selection) => {
              selection.selectAll(".tick text")
                .attr("transform", this.makeTranslate(-(this.dayAxisScale(1) - this.dayAxisScale(0)) / 2, 0))
            }
          )

        this.countAxisScale.domain([0, maxItemCount]).nice()
        d3.select(this.countAxisGroup.nativeElement)
          .transition()
          .duration(500)
          .call(this.countAxis)
        // -------------------------------

        $("rect.bar-background")
          .hover((ev) => {
            const bar = $(ev.target.parentElement).find("rect.bar-count")
            switch (ev.type) {
              case "mouseenter":
                ev.target.setAttribute("fill", "#f0f0f0")
                bar.attr("stroke-width", 1)
                break;
              case "mouseleave":
                ev.target.setAttribute("fill", "transparent")
                bar.attr("stroke-width", 0)
                break;
            }
          })

        const trackerNameElements = $('.tracker-name') as any
        trackerNameElements.tooltip()

        this.onSortMethodChanged(this.sortMethodIndex)
      })
    );

  }

  public toDarkerColor(color: string): string {
    return d3.hsl(color).darker(2).toString()
  }

  public onSortMethodChanged(index: number) {
    if (this.data) {
      this.data.participantList.sort(this.SORT_METHODS[index].sortFunc)
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

  private isWithinScale(dayIndex: number): boolean {
    return this.dayIndexRange[0] <= dayIndex && this.dayIndexRange[1] >= dayIndex
  }

  private makeParticipantRowTransform(row: ParticipantRow, index: number): string {
    let currentY = 0;
    for (let i = 0; i < index; i++) {
      currentY += this.calcHeightOfParticipantRow(row)
      currentY += this.PARTICIPANT_MARGIN
    }
    return this.makeTranslate(0, currentY)
  }

  private calcHeightOfParticipantRow(row: ParticipantRow): number {
    const numTrackers = row.trackingDataList.length
    return numTrackers === 0 ? this.PARTICIPANT_MINIMUM_HEIGHT : (numTrackers * this.TRACKER_ROW_HEIGHT + (numTrackers - 1) * this.TRACKER_MARGIN)
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
            email: participantData.participant.user.email,
            alias: participantData.participant.alias,
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
  email: string,
  noLogDayIndices: Array<number>, trackingDataList: Array<TrackerRow>
}

export interface EngagementData {
  earliestExperimentStart: number
  maxTotalDays: number, participantList: Array<ParticipantRow>
}
