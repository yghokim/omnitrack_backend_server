import { Component, OnInit, Input } from '@angular/core';
import { DecodedItem, ProductivityLog, ProductivityHelper } from '../../../../shared-visualization/custom/productivity-helper';
import * as d3 from 'd3';
import * as moment from 'moment';
import { unique, groupArrayByVariable, toDurationString } from '../../../../../../shared_lib/utils';
import { HighChartsHelper } from '../../../../shared-visualization/highcharts-helper';
import { Chart } from 'angular-highcharts';
import { IParticipantDbEntity } from '../../../../../../omnitrack/core/db-entity-types';

@Component({
  selector: 'app-duration-coverage',
  templateUrl: './duration-coverage.component.html',
  styleUrls: ['./duration-coverage.component.scss']
})
export class DurationCoverageComponent implements OnInit {

  private _participants: Array<IParticipantDbEntity>
  @Input() set participants(participants: Array<IParticipantDbEntity>) {
    this._participants = participants
    this.refresh(this._segments, this._logs, this._participants)
  }

  private _logs: Array<ProductivityLog>
  @Input() set logs(logs: Array<ProductivityLog>) {
    this._logs = logs
    this.refresh(this._segments, this._logs, this._participants)
  }

  private _segments: number = 48
  @Input() set segments(seg: number) {
    this._segments = seg
    this.refresh(this._segments, this._logs, this._participants)
  }

  public chart
  public totalDurationChart: Chart

  constructor() { }

  ngOnInit() {
  }

  refresh(numSegments: number, logs: Array<ProductivityLog>, participants: Array<IParticipantDbEntity>) {
    if (numSegments && logs && participants) {
      const grouped = groupArrayByVariable(logs, "productivity")
      const segmentLength = 1 / numSegments

      const distPerProductivity: Array<any> = []

      for (let productivity of Object.keys(grouped)) {
        const segments = new Array<number>(numSegments).fill(0)
        grouped[productivity].forEach(log => {
          segments.forEach((_, i) => {
            const segmentStart = i * segmentLength
            if (log.fromDateRatio <= segmentStart + segmentLength && log.toDateRatio >= segmentStart) {
              const from = Math.max(log.fromDateRatio, segmentStart)
              const to = Math.min(log.toDateRatio, segmentStart + segmentLength)
              if (to - from >= segmentLength * .5) {
                segments[i]++
              }
            }
          })
        })


        var productivityColor = ProductivityHelper.getProductivityColor(Number.parseInt(productivity))
        var productivityLabel = ProductivityHelper.getProductivityLabel(Number.parseInt(productivity))

        distPerProductivity.push({
          name: productivityLabel,
          data: segments,
          color: productivityColor
        })
      }

      const chart = HighChartsHelper.makeDefaultChartOptions('column', "40%")

      chart.plotOptions = {
        column: {
          stacking: 'normal',
          groupPadding: 0,
          borderWidth: 0,
          pointPadding: 0.05,
          pointPlacement: 'between'
        },
        series: {
          animation: false
        }
      }
      chart.xAxis = {
        type: 'linear',
        //categories: d3.range(0,1, segmentLength),
        tickInterval: 1 / 24 * numSegments,
        labels: {
          formatter: function () {
            const time = this.value * 1 / numSegments * 24
            const hour = Math.floor(time)
            const minute = time - hour
            if (minute <= 0.01) {
              if (hour === 12) {
                return "Noon"
              } else return hour + ":00"
            }
            else return hour + ":" + Math.floor((minute * 60))
          }
        }
      }
      chart.yAxis = {
        allowDecimals: false,
        min: 0,
        title: {
          text: "로그 수",
          margin: 5
        },
        labels: {
          padding: 0
        }
      }

      chart.series = distPerProductivity

      this.chart = new Chart(chart)

      //total covered durations
      const groupedByParticipants = groupArrayByVariable(logs, "user")
      const totalDurationsPerParticipant: Array<{ participant: IParticipantDbEntity, weekdayDuration: number, weekendDuration: number, totalDuration: number }> = []
      for (let userId of Object.keys(groupedByParticipants)) {
        const participant = participants.find(p => p.user._id === userId)
        if (participant) {
          const productivityLogs: Array<ProductivityLog> = groupedByParticipants[userId]
          totalDurationsPerParticipant.push(
            {
              participant: participant,
              weekdayDuration: d3.sum(productivityLogs.filter(l => moment(l.dateStart).isoWeekday() <= 5)
                , l => Math.round((l.toDateRatio - l.fromDateRatio) * 24 * 60 * 60)),
              weekendDuration: d3.sum(productivityLogs.filter(l => moment(l.dateStart).isoWeekday() >= 6)
                , l => Math.round((l.toDateRatio - l.fromDateRatio) * 24 * 60 * 60)),
              totalDuration: d3.sum(productivityLogs
                , l => Math.round((l.toDateRatio - l.fromDateRatio) * 24 * 60 * 60))
            }
          )
        }
      }
      totalDurationsPerParticipant.sort((a, b)=>b.totalDuration - a.totalDuration)

      const chartOptions = HighChartsHelper.makeDefaultChartOptions('bar')
      chartOptions.plotOptions = {
        bar: {
          stacking: 'normal',
          groupPadding: 0,
          borderWidth: 0,
        },
        series: {
          animation: false
        }
      }

      chartOptions.xAxis = {
        type: 'category',
        categories: totalDurationsPerParticipant.map(e => e.participant.alias)
      }

      chartOptions.yAxis = {
        labels:{
          formatter: function(){
            return toDurationString(this.value)
          }
        },
        tickInterval: 12*60*60
      }

      chartOptions.series = [
        {
          name: "Weekdays",
          color: "#d5f825",
          data: totalDurationsPerParticipant.map(entry => entry.weekdayDuration)
        },
        {
          name: "Weekends",
          color: "#de6839",
          data: totalDurationsPerParticipant.map(entry => entry.weekendDuration)
        }
      ]

      this.totalDurationChart = new Chart(chartOptions)

    }
  }
}
