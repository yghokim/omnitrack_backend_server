import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { Engagement } from '../../../../../shared_lib/engagement';

@Component({
  selector: 'app-daily-average',
  templateUrl: './daily-average.component.html',
  styleUrls: ['./daily-average.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailyAverageComponent implements OnInit {

  public data

  public chartOptions

  @Input('height')
  private height: String = '60%'

  @Input('dataType')
  private dataType: String

  @Input('dates')
  private dates: Array<any>

  @Input("engageLog")
  set _engageLog(engageLog: Array<DayData>) {
    if (engageLog.length > 0) {

      const chartOptions = {
        axis: {
          x: {
            type: 'timeseries',
            tick: {
              format: '%Y-%m-%d'
            }
          }
        }
      } as any
/*
      chartOptions.tooltip = {
        shared: true,
        valueDecimals: 2
      }*/

      var dateCountValue: any[] = engageLog.map(function (x, i) {
        if (i < this.dates.length) {
          return [this.dates[i].valueOf(), x.avgCount]
        }
      }, this)
      var dateCountRange: any[] = engageLog.map(function (x, i) {
        if (i < this.dates.length) {
          return [this.dates[i].valueOf(), x.minCount, x.maxCount]
        }
      }, this)
      var dateDurValue: any[] = dateDurValue = engageLog.map(function (x, i) {
        if (i < this.dates.length) {
          return [this.dates[i].valueOf(), x.avgDuration]
        }
      }, this)
      var dateDurRange: any[] = dateDurRange = engageLog.map(function (x, i) {
        if (i < this.dates.length) {
          return [this.dates[i].valueOf(), x.minDuration, x.maxDuration]
        }
      }, this)

      /*
      //here a better method for checking whether date or number is needed!
      if (this.dates[0].valueOf() < 1000) {
        engageLog = engageLog.slice(this.dates[0], this.dates[this.dates.length])
        chartOptions.tooltip = {
          shared: true,
          valueDecimals: 2,
          headerFormat: '<small>Day {point.key}</small><br>'
        }

        chartOptions.xAxis = {
          crosshair: {
            width: 2
          }
        }
      }*/

      if (this.dataType === "launchCount") {

        chartOptions.series = [{
          name: 'App Launches',
          data: dateCountValue,
          zIndex: 1,
          color: "#004d80",
          marker: {
            fillColor: 'white',
            lineWidth: 1,
            lineColor: 'black',
            radius: 2
          }
        }, {
          name: 'Range',
          data: dateCountRange,
          type: 'arearange',
          lineWidth: 0,
          linkedTo: ':previous',
          color: "#99d6ff",
          fillOpacity: 0.3,
          zIndex: 0,
          marker: {
            enabled: false
          }
        }
        ]
        chartOptions.axis.y = {
          min: 0,
          label: "Average number of launches",
          minorTickInterval: 10,
          tickInterval: 20
        }
      }

      else if (this.dataType === "sessionEngagement") {

        chartOptions.series = [{
          name: 'Session Duration',
          data: dateDurValue,
          zIndex: 1,
          marker: {
            fillColor: 'white',
            lineWidth: 1,
            lineColor: '#84315d',
            radius: 2
          }
        }, {
          name: 'Range',
          data: dateDurRange,
          type: 'arearange',
          lineWidth: 0,
          fillOpacity: 0.3,
          linkedTo: ':previous',
          zIndex: 0,
          marker: {
            enabled: false
          }
        }
        ];
        chartOptions.axis.y = {
          min: 0,
          label: "Average session duration (min)",
          minorTickInterval: 10,
          tickInterval: 20
        }
      }
      else { console.log("Not defined chartDataType") }
      
      this.chartOptions = chartOptions

    }
  }

  constructor() { }

  ngOnInit() {

  }

}

export interface DayElement {
  date: Date,
  user: String,
  engagements?: Array<Engagement>,
  launchCount?: number,
  totalDuration?: number
}
export interface DayData {
  dayElements: Array<DayElement>,
  avgCount?: number,
  avgDuration?: number,
  maxCount?: number,
  maxDuration?: number,
  minCount?: number,
  minDuration?: number
}