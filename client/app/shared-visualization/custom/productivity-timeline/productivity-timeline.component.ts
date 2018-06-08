import { Component, OnInit, Input, OnDestroy, ViewChild, ElementRef } from "@angular/core";
import AttributeHelper from "../../../../../omnitrack/core/attributes/attribute.helper";
import AttributeManager from "../../../../../omnitrack/core/attributes/attribute.manager";
import TypedStringSerializer from "../../../../../omnitrack/core/typed_string_serializer";
import {
  IItemDbEntity,
  ITrackerDbEntity
} from "../../../../../omnitrack/core/db-entity-types";

import { TimePoint } from "../../../../../omnitrack/core/datatypes/field_datatypes";
import * as groupArray from 'group-array';
import * as moment from 'moment-timezone';
import { Moment } from "moment";
import * as bigdecimal from 'bigdecimal';
import * as d3 from "d3";
import { ScaleLinear, ScaleBand } from 'd3-scale'
import { ScaleOrdinal, Axis } from "d3";
import { ProductivityLog, ProductivityHelper, OmitLog } from "../productivity-helper";
import { Subject, Subscription, BehaviorSubject } from "rxjs";
import { filter, combineLatest } from 'rxjs/operators';
import { D3Helper } from "../../d3-helper";
import * as _s from 'underscore.string';
import * as $ from 'jquery';
import 'bootstrap';

@Component({
  selector: "app-productivity-timeline",
  templateUrl: "./productivity-timeline.component.html",
  styleUrls: ["./productivity-timeline.component.scss"]
})
export class ProductivityTimelineComponent implements OnInit, OnDestroy {

  isBusy = true

  readonly ROW_HEIGHT = 40

  private readonly _internalSubscriptions = new Subscription()

  readonly visualizationWidth = new Subject<number>();
  visualizationAreaHeight = 100
  timelineAreaWidth = 0

  padding = { left: 90, top: 20, right: 10, bottom: 0 }

  readonly timeOfDayScale: ScaleLinear<number, number> = d3.scaleLinear().domain([0, 1])

  private readonly timeOfDayAxis: Axis<number | { valueOf(): number }>

  data = new BehaviorSubject<ProductivityTimelineData>(null)

  //productivity | mood
  chartModes = [
    {
      key: 'productivity',
      label: '생산성'
    },
    {
      key: 'mood',
      label: '행복도'
    }
  ]

  selectedChartMode: string = 'productivity'

  @Input("data")
  set _logs(data: { logs: Array<ProductivityLog>, omitLogs: Array<OmitLog>, overrideStartDate?: number }) {

    if (data) {
      if (data.logs) {
        if (data.logs.length > 0) {
          const days = D3Helper.makeDateSequence(data.logs.map(log => new Date(log.dateStart)), true, data.overrideStartDate).map(d => d.getTime())

          const grouped = groupArray(data.logs, "dateStart")

          this.data.next({
            days: days, groups: days.map(day => {
              const omitLog = data.omitLogs ? data.omitLogs.find(l => l.dateStart === day) : null
              return {
                day: day, logs: grouped[day.toString()], omitNote: data.omitLogs && omitLog ? omitLog.note : null,
                omitNoteTimestamp: data.omitLogs && omitLog ? omitLog.timestamp : null
              }
            })
          })
        }
      }

    }

    this.isBusy = false
  }

  @ViewChild("xAxisGroup") xAxisGroup: ElementRef
  @ViewChild("chartMainGroup") chartMainGroup: ElementRef

  constructor() {
    this.timeOfDayAxis = d3.axisTop(this.timeOfDayScale)
      .tickSize(0).tickPadding(5)
      .tickValues(ProductivityHelper.TIME_OF_DAY_TICKS)
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
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.visualizationWidth.pipe(combineLatest(this.data.pipe(filter(d => d != null)), (width, data) => { return { data: data, width: width } })).subscribe(
        data => {
          this.updateChart(data.data, data.width)
        }
      )
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  getGroupOfDay(day: number, data: ProductivityTimelineData): ProductivityLogGroup {
    if (data) {
      return data.groups.find(g => g.day === day)
    } else return null
  }

  updateChart(data: ProductivityTimelineData, width: number) {

    this.visualizationAreaHeight = this.padding.top + this.padding.bottom + data.days.length * this.ROW_HEIGHT

    this.timelineAreaWidth = width - this.padding.left - this.padding.right

    this.timeOfDayScale.range([0, this.timelineAreaWidth])

    d3.select(this.xAxisGroup.nativeElement)
      .call(this.timeOfDayAxis)
      .call(selection => {
        selection.select(".domain").attr("opacity", "0.3")
      })
  }

  makeTranslate(x: number, y: number): string {
    return D3Helper.makeTranslate(x, y)
  }

  isWeekend(dateStart: number): boolean {
    const dayOfWeek = this.getDayOfWeek(dateStart)
    return dayOfWeek === 6 || dayOfWeek === 7
  }

  getDayOfWeek(dateStart: number): number {
    return moment(dateStart).isoWeekday()
  }
}

type ProductivityTimelineData = {
  days: Array<number>,
  groups: Array<ProductivityLogGroup>
}

export type ProductivityLogGroup = {
  day: number,
  logs: Array<ProductivityLog>,
  omitNote?: string,
  omitNoteTimestamp?: number,
}