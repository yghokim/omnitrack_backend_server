import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { EngagementDataService } from '../../experiment-overview/client-usage/engagement-data.service';

@Component({
  selector: 'app-users-per-day',
  template: '<app-c3 main [options]="chartOptions" [data]="chartData" ></app-c3>',
  styleUrls: ['./users-per-day.component.scss']
})
export class UsersPerDayComponent implements OnInit {

  public chartOptions = {
    axis: {
      x: {
        type: 'timeseries',
        tick: {
          format: '%Y-%m-%d'
        }
      },
      y: {
        min: 0,
        label: "Active Users per Day"
      }
    }
  }

  public chartData

  private _dates: Array<any>
  @Input() set dates(dates: Array<any>) {
    if (this._dates !== dates) {
      this._dates = dates
      this.updateChartData(dates, this._logs)
    }
  }

  private _logs: Array<any>
  @Input('engageLogs')
  set _engageLog(engageLogs: Array<any>) {
    if (this._logs !== engageLogs) {
      this._logs = engageLogs
      this.updateChartData(this._dates, engageLogs)
    }
  }

  constructor(private engagementService: EngagementDataService) { }

  ngOnInit() {

  }

  private updateChartData(dates: Array<any>, userLogs: Array<any>) {

    if (dates && dates.length > 0 && userLogs && userLogs.length > 0) {
      const usersPerDay = []
      for (let date of userLogs) {
        var activeUsers = 0;
        for (let element of date.dayElements) {
          if (element.engagements.length > 0) {
            activeUsers++;
          }
        }
        usersPerDay.push({
          x: date.dayElements[0].date.valueOf(), 
          y: activeUsers
        })
      }
      var average = 0;
      for (let user of usersPerDay) { average += user.y }
      if (usersPerDay.length !== 0) {
        average = average / usersPerDay.length
      }

      this.chartData = {
        columns: [
          ["x"].concat(dates.map(d => d.toDateString())),
          ["users"].concat(usersPerDay.map(d => d.y))
        ]
      }

      console.log("users per day:")
      console.log(this.chartData)
    }
  }
  /*
    makeChart() {
      
      chartOptions.tooltip = {
        shared: true,
        valueDecimals: 2
      }
      chartOptions.xAxis = {
        type: 'datetime',
        crosshair: {
          width: 2
        }
      }
      chartOptions.series = [{
        name: 'Active Users per Day',
        data: this.usersPerDay,
        zIndex: 1,
        color: "#004d80",
        marker: {
          fillColor: 'none',
          lineWidth: 0,
          lineColor: 'black',
          radius: 1
        }
      }]
      chartOptions.yAxis = {
        min: 0,
        title: {
          text: "Users",
          margin: 5
        },
      }
      this.chart = new Chart(chartOptions);
    }*/

}
