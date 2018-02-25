import { Component, OnInit, Input, OnDestroy, ViewChild, ElementRef } from "@angular/core";
import AttributeHelper from "../../../../../omnitrack/core/attributes/attribute.helper";
import AttributeManager from "../../../../../omnitrack/core/attributes/attribute.manager";
import TypedStringSerializer from "../../../../../omnitrack/core/typed_string_serializer";
import {
  IItemDbEntity,
  ITrackerDbEntity
} from "../../../../../omnitrack/core/db-entity-types";
import 'rxjs/add/operator/combineLatest';
import { TimePoint } from "../../../../../omnitrack/core/datatypes/field_datatypes";
import * as groupArray from 'group-array';
import * as moment from 'moment-timezone';
import { Moment } from "moment";
import * as bigdecimal from 'bigdecimal';
import d3 = require("d3");
import { ScaleLinear, ScaleBand } from 'd3-scale'
import { ScaleOrdinal, Axis } from "d3";
import { ProductivityLog } from "../productivity-dashboard/productivity-dashboard.component";
import { Subject } from "rxjs/Subject";
import { D3Helper } from "../../d3-helper";
import { Subscription } from "rxjs/Subscription";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import * as _s from 'underscore.string';

@Component({
  selector: "app-productivity-timeline",
  templateUrl: "./productivity-timeline.component.html",
  styleUrls: ["./productivity-timeline.component.scss"]
})
export class ProductivityTimelineComponent implements OnInit, OnDestroy {

  isBusy = true

  readonly ROW_HEIGHT = 40

  readonly TIME_OF_DAY_TICKS = [0, 3 / 24, 6 / 24, 9 / 24, 12 / 24, 15 / 24, 18 / 24, 21 / 24, 1]

  private readonly _internalSubscriptions = new Subscription()

  readonly visualizationWidth = new Subject<number>();
  visualizationAreaHeight = 100

  padding = { left: 80, top: 20, right: 10, bottom: 0 }

  private readonly timeOfDayScale: ScaleLinear<number, number> = d3.scaleLinear().domain([0, 1])

  private readonly timeOfDayAxis: Axis<number | { valueOf(): number }>

  private readonly dateScale: ScaleBand<number> = d3.scaleBand<number>().paddingInner(0.1).paddingOuter(0.05)

  private readonly dateAxis: Axis<number | {valueOf(): number }>

  data = new BehaviorSubject<ProductivityTimelineData>(null)

  @Input()
  productivityColorScale: ScaleLinear<d3.RGBColor, string>

  @Input("logs")
  set _logs(logs: Array<ProductivityLog>) {

    if (logs) {
      if (logs.length > 0) {
        const dates = logs.map(log => log.dateStart)
        const minDate = d3.min(dates, (date) => date)
        const maxDate = d3.max(dates, (date) => date)

        console.log("min : " + minDate)
        console.log("max : " + maxDate)

        const days = d3.timeDays(new Date(minDate), moment(maxDate).add(1, 'd').toDate()).map(d => d.getTime())

        const grouped = groupArray(logs, "dateStart")

        const groups = Array<ProductivityLogGroup>()
        for(let date of Object.keys(grouped)) {
          groups.push({day: Number.parseInt(date), logs: grouped[date]})
        }
        this.data.next({days: days, groups: groups})
      }

    }

    this.isBusy = false
    console.log(logs)
  }

  @ViewChild("xAxisGroup") xAxisGroup: ElementRef
  @ViewChild("yAxisGroup") yAxisGroup: ElementRef
  @ViewChild("chartMainGroup") chartMainGroup: ElementRef

  constructor() {
    this.timeOfDayAxis = d3.axisTop(this.timeOfDayScale)
      .tickSize(0).tickPadding(5)
      .tickValues(this.TIME_OF_DAY_TICKS)
      .tickFormat((d: number) => {
        switch (d) {
          case 1:
          case 0: return "자정"
          case 0.5: return "정오"
          default:
            var hourOfDay = Math.floor(d * 24);
            var minute = Math.round((d * 24 - hourOfDay) * 60)

            if (minute == 60) {
              hourOfDay++
              minute = 0
            }

            var result
            if (minute < 1) {
              result = _s.pad(hourOfDay, 2, '0')
            }
            else result = _s.pad(hourOfDay, 2, '0') + ":" + _s.pad(minute, 2, '0')
            return result
        }
      })

    this.dateAxis = d3.axisLeft(this.dateScale)
      .tickSize(0).tickPadding(5)
      .tickFormat(d=>{
        return moment(d).format("YYYY-MM-DD")
      })
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.visualizationWidth.combineLatest(this.data.filter(d=>d!=null), (width, data) => { return { data: data, width: width } }).subscribe(
        data => {
          this.updateChart(data.data, data.width)
        }
      )
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  updateChart(data: ProductivityTimelineData, width: number) {
    this.visualizationAreaHeight = this.padding.top + this.padding.bottom + data.days.length * this.ROW_HEIGHT

    this.timeOfDayScale.range([0, width - this.padding.left - this.padding.right])

    this.dateScale.domain(data.days).range([0, data.days.length * this.ROW_HEIGHT])

    d3.select(this.xAxisGroup.nativeElement)
      .call(this.timeOfDayAxis)
      .call(selection => {
        selection.select(".domain").attr("opacity", "0.3")
      })

    d3.select(this.yAxisGroup.nativeElement)
      .call(this.dateAxis)
      .call(selection => {
        selection.selectAll(".tick text")
          .attr("font-size", "13px")
          .attr("fill", "#757575")
          .attr("font-weight", "400")
        selection.select(".domain").remove()
      })

    const mainSelection = d3.select(this.chartMainGroup.nativeElement)
    
    const groupSelection = mainSelection.selectAll("g.dayline").data(data.groups)

    const enter = groupSelection.enter().append("g")
      .attr("class", "dayline")
      .attr("transform", d=>{ return D3Helper.makeTranslate(0, this.dateScale(d.day) ) })

    enter.append("rect")
      .attr("class", "background")
      .attr("fill", "#f0f0f0")

    mainSelection.selectAll("rect.background")  
      .attr("height", this.dateScale.bandwidth())
      .attr("width", width - this.padding.left - this.padding.right)

    groupSelection.exit().remove()

    const durationCellSelection = groupSelection.merge(enter)
      .selectAll("rect.duration").data(d=>{ return d.logs })
    
    const durationEnter = durationCellSelection.enter().append("rect")
      .attr("class", "duration")
      .attr("height", this.dateScale.bandwidth())
      .attr("x", d => (this.timeOfDayScale(d.fromDateRatio) + this.timeOfDayScale(d.toDateRatio))*.5 )

    durationCellSelection.merge(durationEnter)
      .transition()
      .duration(800)
      .attr("fill", d=> this.productivityColorScale(d.productivity))
      .attr("x", d => this.timeOfDayScale(d.fromDateRatio) + 0.5)
      .attr("rx", 3)
      .attr("ry", 3)
      .attr("width", d => (this.timeOfDayScale(d.toDateRatio) - this.timeOfDayScale(d.fromDateRatio)) - 1)

      

    durationCellSelection.exit().remove()
  }

  makeTranslate(x: number, y: number): string {
    return D3Helper.makeTranslate(x, y)
  }
}

type ProductivityTimelineData = {
  days: Array<number>,
  groups: Array<ProductivityLogGroup>
}

type ProductivityLogGroup = {
  day: number,
  logs: Array<ProductivityLog>
}