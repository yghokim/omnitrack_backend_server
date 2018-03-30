import { Component, OnInit, Input } from '@angular/core';
import { DecodedItem, ProductivityLog, ProductivityHelper } from '../../../../shared-visualization/custom/productivity-helper';
import * as d3 from 'd3';
import { unique, groupArrayByVariable } from '../../../../../../shared_lib/utils';
import { HighChartsHelper } from '../../../../shared-visualization/highcharts-helper';
import { Chart } from 'angular-highcharts';

@Component({
  selector: 'app-duration-coverage',
  templateUrl: './duration-coverage.component.html',
  styleUrls: ['./duration-coverage.component.scss']
})
export class DurationCoverageComponent implements OnInit {

  private _logs: Array<ProductivityLog> = []
  @Input() set logs(logs: Array<ProductivityLog>) {
    this._logs = logs
    this.refresh(this._segments, this._logs)
  }

  private _segments: number = 48
  @Input() set segments(seg: number) {
    this._segments = seg
    this.refresh(this._segments, this._logs)
  }

  public chart

  constructor() { }

  ngOnInit() {
  }

  refresh(numSegments: number, logs: Array<ProductivityLog>) {
    console.log(unique(logs.map(log => log.productivity)))
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

    console.log(distPerProductivity)

    const chart = HighChartsHelper.makeDefaultChartOptions('column')

    chart.plotOptions = {
      column: {
        stacking: 'normal',
        groupPadding: 0,
        borderWidth: 0,
        pointPadding: 0.05,
        pointPlacement: 'between'
      }
    }
    chart.xAxis = {
      type: 'linear',
      //categories: d3.range(0,1, segmentLength),
      tickInterval: 1/24 * numSegments,
      labels: {
        formatter: function(){
          const time = this.value * 1/numSegments * 24
          const hour = Math.floor(time)
          const minute = time - hour
          if(minute <= 0.01)
          {
            if(hour === 12){
              return "Noon"
            }else return hour + ":00"
          }
          else return hour + ":" + Math.floor((minute*60))
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
  }

}
