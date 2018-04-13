import { Component, OnInit, Input } from '@angular/core';
import { DecodedItem } from '../../../../shared-visualization/custom/productivity-helper';
import * as d3 from 'd3';
import { Chart } from 'angular-highcharts';
import { HighChartsHelper } from '../../../../shared-visualization/highcharts-helper';

@Component({
  selector: 'app-logging-time-of-day-chart',
  templateUrl: './logging-time-of-day-chart.component.html',
  styleUrls: ['./logging-time-of-day-chart.component.scss']
})
export class LoggingTimeOfDayChartComponent implements OnInit {

  public chart: Chart
  private title: string
  private heightParamOverride: string = null

  @Input("heightParamOverride") set _heightParamOverride(param: string){
    this.heightParamOverride = param
    if(this.chart){
      this.chart.options.chart.height = param
    }
  }

  @Input("title") set _title(newTitle: string) {
    this.title = newTitle
    if(this.chart){
      this.chart.options.title = {text: newTitle, style: "font-size: 8pt", margin: 0}
    }
  }

  @Input() set decodedItems(list: Array<DecodedItem>) {
    const numBins = 24
    const binSize = 1 / numBins
    const binBounds = d3.range(0, 1, binSize)
    const dist = binBounds.map((bin, binIndex) => {
      let count = 0
      list.forEach(item => {
        if (binIndex === numBins - 1) {
          if (item.timestampDayRatio >= bin && item.timestampDayRatio <= bin + binSize) {
            count++
          }
        } else if (item.timestampDayRatio >= bin && item.timestampDayRatio < bin + binSize) {
          count++
        }
      })
      return count
    })

    const chartOptions = HighChartsHelper.makeDefaultChartOptions('column', this.heightParamOverride || '45%')

    chartOptions.chart.plotBackgroundColor = "#f0f0f0"
    
    chartOptions.plotOptions = {
      column: {
        groupPadding: 0,
        borderWidth: 0,
        pointPadding: 0,
        pointPlacement: 'between'
      },
      areaspline: {
        enableMouseTracking: false,
        pointPlacement: 'between',
        marker: {
          enabled: false
        },
        lineWidth: 0
      },
      series: {
        animation: false
      }
    }

    chartOptions.legend = {
      enabled: false
    }

    chartOptions.xAxis = {
      type: 'linear',
      endOnTick: true,
      //categories: d3.range(0,1, segmentLength),
      tickInterval: 3,
      labels: {
        formatter: function(){
          const time = this.value * 1/numBins * 24
          const hour = Math.floor(time)
          const minute = time - hour
          if(minute <= 0.01)
          {
            if(hour === 12){
              return "Noon"
            }else return hour
          }
          else return hour
        }
      }
    }
    chartOptions.yAxis = {
      allowDecimals: false,
      min: 0,
      title: {
        enabled: false
      },
      labels: {
        padding: 0
      }
    }

    chartOptions.tooltip={
      enabled: false
    }

    chartOptions.series = [{
      name: "Log count",
      data: dist,
      color: "#a63e63"
    }]

    chartOptions.title = {
      text: this.title,
      style: "font-size: 9pt",
      margin: 0
    }

    this.chart = new Chart(chartOptions)
  }

  constructor() {
  }

  ngOnInit() {
  }

}
