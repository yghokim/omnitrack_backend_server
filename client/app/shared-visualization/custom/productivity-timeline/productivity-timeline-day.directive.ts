import { Directive, ElementRef, Input } from '@angular/core';
import { ScaleLinear } from 'd3';
import { ProductivityLogGroup } from './productivity-timeline.component';
import { ProductivityHelper, ProductivityLog } from '../productivity-dashboard/productivity-dashboard.component';
import * as d3 from 'd3';
import * as moment from 'moment-timezone';

@Directive({
  selector: '[appProductivityTimelineDay]'
})
export class ProductivityTimelineDayDirective {

  readonly moodScale: ScaleLinear<number, number> = d3.scaleLinear().domain([0, 1])

  timeOfDayScale: ScaleLinear<number, number>
  @Input('scale')
  set _scale(scale: ScaleLinear<number, number>) {
    this.timeOfDayScale = scale
    this.updateChart('scale')
  }

  width: number
  @Input('width')
  set _width(width: number) {
    this.width = width
    this.updateChart('size')
  }

  height: number
  @Input('height')
  set _height(height: number) {
    this.height = height
    this.updateChart('size')
  }

  group: ProductivityLogGroup
  @Input('group')
  set _group(group: ProductivityLogGroup) {
    this.group = group
    this.updateChart('group')
  }

  mode: string
  @Input('mode')
  set _mode(mode: string) {
    this.mode = mode
    this.updateChart(mode)
  }

  productivityColorScale: ScaleLinear<d3.RGBColor, string>

  private mainSelection

  constructor(private elementRef: ElementRef) {
    this.productivityColorScale = ProductivityHelper.productivityColorScale
    this.mainSelection = d3.select(this.elementRef.nativeElement)
    this.mainSelection.append("rect")
      .attr("class", "background")
      .attr("fill", "#f0f0f0")

    this.mainSelection.append("g")
      .attr("class", "ticks")
      .attr("pointer-events", "none")
      .selectAll("line.tick").data(ProductivityHelper.TIME_OF_DAY_TICKS.slice(1, ProductivityHelper.TIME_OF_DAY_TICKS.length - 1)).enter().append("line").attr("class", "tick")

    this.mainSelection.select("g.ticks")
      .append("line").attr("class", "zerogrid")
      .attr("x1", 0)
      .attr("stroke", "#000")
      .attr("opacity", 0.20)
      .attr("stroke-width", "1px")
  }

  private updateChart(changedFactor: string) {
    if (this.width && this.height && this.timeOfDayScale && this.group) {

      this.moodScale.range([this.height, 0])

      this.mainSelection.select("rect.background")
        .attr("height", this.height)
        .attr("width", this.width)

      const durationCellSelection = this.mainSelection
        .selectAll("rect.duration").data(this.group.logs)

      const durationEnter = durationCellSelection.enter().append("rect")
        .attr("class", "duration")
        .attr("data-html", true)
        .attr("data-offset", 5)
        .attr("data-placement", 'auto')
        .attr("data-title", (d: ProductivityLog) => {
          const body = $("<div></div>")

          const format = "A hh:mm"
          const startMoment = moment(d.dateStart).add(24 * 3600 * d.fromDateRatio, "s")
          const endMoment = moment(d.dateStart).add(24 * 3600 * d.toDateRatio, "s")

          body.append("<b class='bottom-margin-dot5em'>" + startMoment.format(format) + " ~ " + endMoment.format(format) + "</b>")

          const tableBody = $("<table class='tooltip-content'></table>")
          const taskLine = $("<tr></tr>").append("<th>한 일</th>").append("<td>" + d.decodedItem.tasks.map(task => "<span class='badge badge-light'>" + task + "</span>").join(" ") + "</td>")

          const rationaleLine = $("<tr></tr>")
            .append("<th>생산성</th>")
            .append("<td><b>" + ProductivityHelper.getProductivityLabel(d.decodedItem.productivity) + "</b><br><span>" + d.decodedItem.rationale + "</span></td>")

          const placeLine = $("<tr></tr>")
            .append("<th>장소</th>")
            .append("<td>" + d.decodedItem.location + "</td>")

          const devicesLine = $("<tr></tr>")
            .append("<th>기기</th>")

          if (d.decodedItem.usedDevices.length == 0) {
            devicesLine.append("<td>사용 안함</td>")
          } else {
            devicesLine.append("<td>" + d.decodedItem.usedDevices.map(device => "<span class='badge badge-light'>" + device + "</span>").join(" ") + "</td>")
          }

          const moodLine = $("<tr></tr>")
            .append("<th>행복도</th>")

          if (d.decodedItem.mood) {
            moodLine.append("<td>" + (d.decodedItem.mood * 2).toFixed(1) + "</td>")
          } else moodLine.append("<td>없음</td>")

          const timestampLine = $("<tr></tr>")
            .append("<th>기록시각</th>")

          const timestampMoment = moment(d.decodedItem.item.timestamp)
          let timestampString = timestampMoment.format('M[월] D[일] h:mm a')

          const itemEndMoment = moment(d.decodedItem.to)
          const diffEnd = timestampMoment.diff(itemEndMoment, 'days', true)
          if (diffEnd >= 0 && diffEnd < 1) {
            const duration = moment.duration(timestampMoment.diff(itemEndMoment))
            if (diffEnd <= 1/24) {
              const minutes = duration.asMinutes().toFixed(0)
              if(minutes === "0"){
                timestampString += " (즉시 기록)"
              }
              else{
                timestampString += " (당일 " + duration.asMinutes().toFixed(0) + "분 뒤 기록)"
              }
            }
            else {
              timestampString += " (당일 " + duration.humanize() + " 뒤 기록)"
            }
          } else if (diffEnd >= 1) {
            timestampString += " (" + Math.floor(diffEnd) + "일 뒤 기록)"
          } else {
            timestampString += " (미리 기록)"
          }


          timestampLine.append("<td>" + timestampString + "</td>")

          tableBody.append(taskLine)
          tableBody.append(rationaleLine)
          tableBody.append(placeLine)
          tableBody.append(devicesLine)
          tableBody.append(moodLine)
          tableBody.append(timestampLine)

          body.append(tableBody)

          return body.html()
        })
        .on('mouseenter', (d, i, nodes) => {
          d3.select(nodes[i])
            .attr("opacity", 0.8)
        })
        .on('mouseleave', (d, i, nodes) => {
          d3.select(nodes[i])
            .attr("opacity", 1.0)
        })

      const jSelection = $("rect.duration") as any
      jSelection.tooltip()

      switch (this.mode) {
        case 'mood':
          durationEnter
            .attr("height", 0)
            .attr("y", this.height / 2)
            .attr("x", d => (this.timeOfDayScale(d.fromDateRatio) + this.timeOfDayScale(d.toDateRatio)) * .5)
            .attr("width", d => (this.timeOfDayScale(d.toDateRatio) - this.timeOfDayScale(d.fromDateRatio)) - 1)
          break;
        case 'productivity':
        default:
          durationEnter
            .attr("height", this.height)
            .attr("x", d => (this.timeOfDayScale(d.fromDateRatio) + this.timeOfDayScale(d.toDateRatio)) * .5)
          break;
      }

      const durationUpdate = durationCellSelection.merge(durationEnter).transition().duration(800)

      switch (this.mode) {
        case 'mood':
          durationUpdate.attr("fill", d => {
            if (d.decodedItem.mood) {
              return d.decodedItem.mood > 0.5 ? "#60cb78" : "#ea8271"
            }
            else return "transparent"
          })
            .attr("x", d => this.timeOfDayScale(d.fromDateRatio) + 0.5)
            .attr("y", (d: ProductivityLog) => {
              if (d.decodedItem.mood) {
                return Math.min(this.moodScale(0.5), this.moodScale(d.decodedItem.mood))
              }
              else return this.height / 2
            })
            .attr("height", (d: ProductivityLog) => {
              if (d.decodedItem.mood) {
                return Math.abs(this.moodScale(0.5) - this.moodScale(d.decodedItem.mood))
              } else return 0
            })
            .attr("rx", 0)
            .attr("ry", 0)
            .attr("width", d => (this.timeOfDayScale(d.toDateRatio) - this.timeOfDayScale(d.fromDateRatio)) - 1)
          break;
        case 'productivity':
        default:
          durationUpdate.attr("fill", d => this.productivityColorScale(d.productivity))
            .attr("x", d => this.timeOfDayScale(d.fromDateRatio) + 0.5)
            .attr("y", 0)
            .attr("height", this.height)
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("width", d => (this.timeOfDayScale(d.toDateRatio) - this.timeOfDayScale(d.fromDateRatio)) - 1)
          break;
      }

      durationCellSelection.exit().remove()

      this.mainSelection.selectAll("line.tick")
        .attr("x1", (d: any) => this.timeOfDayScale(d))
        .attr("x2", (d: any) => this.timeOfDayScale(d))
        .attr("y1", 0)
        .attr("y2", this.height)
        .attr("stroke", "#000")
        .attr("opacity", 0.12)
        .attr("stroke-width", "1px")

      this.mainSelection.select("line.zerogrid").transition().duration(500)
        .attr("x2", this.mode === "mood" ? this.width : 0)
        .attr("y1", this.height / 2)
        .attr("y2", this.height / 2)
    }
  }
}
