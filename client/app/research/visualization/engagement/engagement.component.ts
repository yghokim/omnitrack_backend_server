import { Component, ViewChild, ElementRef, Input, OnInit, AfterViewInit, OnDestroy, Directive, ViewChildren, QueryList } from "@angular/core";
import { VisualizationBaseComponent } from "../visualization-base.component";
import { ResearchVisualizationQueryConfigurationService, Scope } from "../../../services/research-visualization-query-configuration.service";
import { Subscription } from "rxjs/Subscription";
import { Observable } from 'rxjs/Observable';
import "rxjs/operator/combineLatest";
import { TrackingDataService } from '../../../services/tracking-data.service';
import { ResearchApiService } from "../../../services/research-api.service";
import { NO_ERRORS_SCHEMA } from '@angular/core';
import * as d3 from 'd3';
import { ScaleLinear } from 'd3-scale'
import { Subject } from "rxjs/Subject";
import { D3VisualizationBaseComponent } from "../d3-visualization-base.component";
import { ScaleOrdinal, Axis } from "d3";
import * as moment from "moment";
import { IItemDbEntity } from "../../../../../omnitrack/core/db-entity-types";
import { EngagementTimelineContainerDirective } from "./engagement-timeline-container.directive";
import * as groupArray from 'group-array';
import { Moment } from "moment-timezone";
import { diffDaysBetweenTwoMoments } from "../../../../../shared_lib/utils";

@Component({
  selector: "app-engagement",
  templateUrl: "./engagement.component.html",
  styleUrls: ["./engagement.component.scss"]
})
export class EngagementComponent extends D3VisualizationBaseComponent<
EngagementData
> implements OnInit, OnDestroy {
 
  isBusy = true;

  readonly X_AXIS_HEIGHT = 20
  readonly Y_AXIS_WIDTH = 120
  readonly TRACKER_NAME_WIDTH = 70

  readonly PARTICIPANT_MARGIN = 6
  readonly TRACKER_MARGIN = 2

  readonly NUM_BLOCKS_PER_DAY = 4


  readonly PARTICIPANT_MINIMUM_HEIGHT = 20
  readonly TRACKER_ROW_HEIGHT = 20

  private readonly _internalSubscriptions = new Subscription();

  readonly visualizationWidth = new Subject<number>();
  private mainChartAreaWidth: number = 0

  private itemCountRangeMax: number = 5

  visualizationAreaHeight = 100

  private hatchPatterns = [
    {
      id: "no-log",
      size: 7,
      pathClass: "no-log-pattern"   
    }
  ]

  scope: Scope
  dayIndexRange: Array<number>

  @ViewChild("xAxisGroup") xAxisGroup: ElementRef
  @ViewChild("yAxisGroup") yAxisGroup: ElementRef
  @ViewChild("chartMainGroup") chartMainGroup: ElementRef

  private readonly dayAxisScale: ScaleLinear<number, number>
  private readonly dayAxis: Axis<number | { valueOf(): number }>

  private readonly colorScale: ScaleLinear<d3.RGBColor, string>

  constructor(
    private queryConfigService: ResearchVisualizationQueryConfigurationService,
    private api: ResearchApiService
  ) {
    super();

    this.dayAxisScale = d3.scaleLinear()
    this.dayAxis = d3.axisTop(this.dayAxisScale)
      .tickSize(0).tickPadding(5)
      .tickFormat( (d:number) => d === 0 || (d - Math.floor(d) > 0.01) || (d>this.dayAxisScale.domain()[1] || d<=this.dayAxisScale.domain()[0]) ? null : d.toString())

    this.colorScale = d3.scaleLinear<d3.RGBColor, number>().domain([1, this.itemCountRangeMax]).interpolate(d3.interpolateHcl).range([d3.rgb("rgb(243, 220, 117)"), d3.rgb("#2387a0")])
    
  }

  ngOnInit() {

    //init visualization

    this._internalSubscriptions.add(
      this.makeDataObservable().do(scopeAndData => {
        this.data = scopeAndData.data
        this.scope = scopeAndData.scope
        this.isBusy = false
      }).combineLatest(this.queryConfigService.dayIndexRange().do(range=>{
        this.dayIndexRange = range
      }), (scopeAndData, range)=>{
        return {scope: scopeAndData.scope, data: scopeAndData.data, range: range}
      }).combineLatest(this.visualizationWidth, (scopeAndData, width) => {
        return { data: scopeAndData.data, scope: scopeAndData.scope, range: scopeAndData.range, width: width }
      }).subscribe(project => {
        this.mainChartAreaWidth = project.width - this.Y_AXIS_WIDTH
        console.log("refresh engagement data.")
        console.log(project)

        //calculate height================
        if (project.data.participantList.length > 0) {
          const participantsWithTrackerHeightTotal = project.data.participantList.map(p => this.calcHeightOfParticipantRow(p)).reduce((a, b) => { return a + b })
          const numZeroTrackerParticipants = project.data.participantList.filter(p => p.trackingDataList.length === 0).length
          this.visualizationAreaHeight = participantsWithTrackerHeightTotal + numZeroTrackerParticipants * this.PARTICIPANT_MINIMUM_HEIGHT + this.X_AXIS_HEIGHT + Math.max(0, (project.data.participantList.length - 1)) * this.PARTICIPANT_MARGIN
        }
        else {
          this.visualizationAreaHeight = 0
        }
        //-----------------------------

        //update axis========================
        this.dayAxisScale.domain([project.range[0], project.range[1]+1]).range([0, project.width - this.Y_AXIS_WIDTH])
        d3.select(this.xAxisGroup.nativeElement)
          .transition()
          .duration(500)
          .call(this.dayAxis).call(
          (selection) => {
            selection.selectAll(".tick text")
              .attr("transform", this.makeTranslate(-(this.dayAxisScale(1) - this.dayAxisScale(0)) / 2, 0))
          }
        )
        //-------------------------------

/*
        //main chart JOIN ============================================================
        const mainD3Selection = d3.select(this.chartMainGroup.nativeElement).selectAll("g.participant")
          .data<ParticipantRow>(project.data.participantList, (participant: ParticipantRow, index) => participant.participantId)

        //Participant Level================================================================================
        const enteredParticipantRow = mainD3Selection.enter().append("g").attr("class", "participant")

        enteredParticipantRow.merge(mainD3Selection).attr("transform", (d, index) => {
          let currentY = 0;
          for (let i = 0; i < index; i++) {
            currentY += this.calcHeightOfParticipantRow(project.data.participantList[i])
            currentY += this.PARTICIPANT_MARGIN
          }

          return this.makeTranslate(0, currentY)
        })

        enteredParticipantRow.append("text")
          .attr("class", "participant-alias")
          .attr("font-size", "12px")
          .attr("text-anchor", "end")
          .attr("dominant-baseline", "middle")
          .attr("alignment-baseline", "middle")

        enteredParticipantRow.append("line")
          .attr("class", "participant-alias-separator")
          .attr("x1", -this.TRACKER_NAME_WIDTH)
          .attr("x2", -this.TRACKER_NAME_WIDTH)
          .attr("y1", 0)
          .attr("stroke", "#b0b0b0")
          .attr("strokeWidth", 1)

        enteredParticipantRow.merge(mainD3Selection).select("text.participant-alias")
          .attr("transform", (p, i) => {
            return this.makeTranslate(
              -5 - this.TRACKER_NAME_WIDTH, 
              this.calcHeightOfParticipantRow(project.data.participantList[i]) / 2)
          })
          .text((d) => d.alias)

        enteredParticipantRow.merge(mainD3Selection).select("line.participant-alias-separator")
          .attr("y2", (d)=>{return this.calcHeightOfParticipantRow(d)})

        mainD3Selection.exit().remove()
        
        //Tracker Level====================================================================================
        const trackerD3Selection = mainD3Selection.selectAll("g.tracker").data(participant=>participant.trackingDataList, (t: TrackerRow)=>t.trackerId)
        console.log("trackers enter selection:")
        console.log(trackerD3Selection)
        console.log(trackerD3Selection.enter())
        const enteredTrackerRow = trackerD3Selection.enter().append("g").attr("class", "tracker")

        enteredTrackerRow.merge(trackerD3Selection).attr("transform", (t, index)=>{
          return this.makeTranslate(0, index * (this.TRACKER_ROW_HEIGHT + this.TRACKER_MARGIN))
        })

        enteredTrackerRow.append("text").attr("class", "tracker-name")
          .attr("font-size", "10px")
          .attr("dominant-baseline", "middle")
          .attr("alignment-baseline", "middle")
          .attr("transform", (t)=>this.makeTranslate(-this.TRACKER_NAME_WIDTH+3, this.TRACKER_ROW_HEIGHT/2))
        
        enteredTrackerRow.merge(trackerD3Selection).select("text.tracker-name")
          .text((t)=> t.trackerName)

        trackerD3Selection.exit().remove()

        //Item Level=========================================================================================*/
      })
    );

  }

  private colorLegends(): Array<{color: string, value: string}>{
    const array = []
    for(let i = 1; i <= this.itemCountRangeMax; i++)
    {
      array.push({value: i.toFixed(0), color: this.colorScale(i)})
    }
    array.push({value: ">"+this.itemCountRangeMax.toFixed(0), color: this.colorScale(this.itemCountRangeMax+1)})

    return array
  }

  private isWithinScale(dayIndex: number): boolean{
    return this.dayIndexRange[0] <= dayIndex && this.dayIndexRange[1] >= dayIndex
  }

  private makeParticipantRowTransform(row: ParticipantRow, index: number): string{
    let currentY = 0;
      for (let i = 0; i < index; i++) {
        currentY += this.calcHeightOfParticipantRow(row)
        currentY += this.PARTICIPANT_MARGIN
    }
    return this.makeTranslate(0, currentY)
  }

  private calcHeightOfParticipantRow(row: ParticipantRow): number {
    const numTrackers = row.trackingDataList.length
    return numTrackers == 0 ? this.PARTICIPANT_MINIMUM_HEIGHT : (numTrackers * this.TRACKER_ROW_HEIGHT + (numTrackers-1)*this.TRACKER_MARGIN)
  }

  private makeScopeAndParticipantsObservable(): Observable<{ trackingDataService: TrackingDataService, scope: Scope, participants: Array<any> }> {
    return this.api.selectedExperimentService.map(service => service.trackingDataService).do(service => {
      service.registerConsumer("engagementComponent")
    })
      .combineLatest(this.queryConfigService.scopeSubject,
      this.api.selectedExperimentService.flatMap(service => service.getParticipants()), (service, scope, participants) => {
        return { trackingDataService: service, scope: scope, participants: participants }
      }
      )
  }

  private makeDataObservable(): Observable<{scope: Scope, data: EngagementData}> {
    return this.makeScopeAndParticipantsObservable().flatMap(project => {
      const userIds = project.participants.map(p => p.user._id)
      return project.trackingDataService.getTrackersOfUser(userIds)
        .combineLatest(project.trackingDataService.getItemsOfUser(userIds), (trackers, items) => {
          //make data
          const today = moment().startOf("day")
          let earliestExperimentStart: number = null
          const data = project.participants.map(participant => {
            const experimentRangeStart = new Date(participant.experimentRange.from).getTime()
            if (!earliestExperimentStart) earliestExperimentStart = experimentRangeStart
            else {
              earliestExperimentStart = Math.min(earliestExperimentStart, experimentRangeStart)
            }

            console.log("startDate: " + participant.experimentRange.from + " => startOf: " + moment(participant.experimentRange.from).startOf("day").toISOString())
            const startDate = moment(participant.experimentRange.from).startOf("day")
            const numDays = diffDaysBetweenTwoMoments(today, startDate, project.scope.includeWeekends) + 1

            const trackingDataList = trackers.filter(tracker => tracker.user === participant.user._id).map(tracker => {
              const itemWithRelative = items.filter(item => {
                if(item.tracker === tracker._id)
                {
                  if(project.scope.includeWeekends)
                  {
                    return true
                  }
                  else{
                    const dow = moment(item.timestamp).isoWeekday()
                    return dow!==6 && dow!==7
                  }
                }
                return false
              }).map(item => {
                const timestampMoment = moment(item.timestamp)
                const day = diffDaysBetweenTwoMoments(timestampMoment, startDate, project.scope.includeWeekends)
                const dayRatio = timestampMoment.diff(moment(timestampMoment).startOf("day"), "days", true)
                const block = Math.floor(dayRatio / (1/this.NUM_BLOCKS_PER_DAY))
                return { day: day, dayRatio: dayRatio, block: block, dayAndBlock: day+"_"+block, item: item }
              })
              
              const grouped = groupArray(itemWithRelative, "dayAndBlock")
              const itemBlocks = []
              for(let dayAndBlock in grouped){
                const group = grouped[dayAndBlock]
                const split = dayAndBlock.split("_")
                const day = Number.parseInt(split[0])
                const block = Number.parseInt(split[1])
                itemBlocks.push({day: day, blockIndex: block, items: group})
              }

              return {
                trackerName: tracker.name.toString(), trackerId: tracker._id.toString(), itemBlocks: itemBlocks
              }
            })

            const noLogDayIndices = []
            for(let i = 0; i < numDays; i++)
            {
              if(trackingDataList.find(tracker=>
                tracker.itemBlocks.find(it=>it.day === i) != null) == null)
                {
                  noLogDayIndices.push(i)
                }
            }

            return {
              participantId: participant._id.toString(), alias: participant.alias.toString(), daysSinceStart: numDays,
              noLogDayIndices: noLogDayIndices,
              trackingDataList: trackingDataList
            }
          })

          return {scope: project.scope, data: { earliestExperimentStart: earliestExperimentStart, maxTotalDays: d3.max(data, (datum) => datum.daysSinceStart), participantList: data }}
        })
    })
  }

  ngOnDestroy() {
    if (this.api.selectedExperimentServiceSync) {
      this.api.selectedExperimentServiceSync.trackingDataService.unregisterConsumer("engagementComponent")
    }
    this._internalSubscriptions.unsubscribe();
  }
}

export type ItemBlockRow = {
  day: number, blockIndex: number, items: Array<IItemDbEntity>
}

export type TrackerRow = {
  trackerName: string,
  trackerId: string,
  itemBlocks: Array<ItemBlockRow>,
}

export type ParticipantRow = { participantId: string, alias: string, daysSinceStart: number, 
  
  noLogDayIndices: Array<number>, trackingDataList: Array<TrackerRow> }

export type EngagementData = { earliestExperimentStart: number
  maxTotalDays: number, participantList: Array<ParticipantRow> }
