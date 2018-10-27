import { Component, OnInit, Input } from '@angular/core';
import { EngagementDataService } from '../../experiment-overview/client-usage/engagement-data.service';

@Component({
  selector: 'app-devices-per-day',
  template: '<app-c3 main [options]="chartOptions" [data]="chartData" ></app-c3>',
  styleUrls: ['./devices-per-day.component.scss']
})
export class DevicesPerDayComponent implements OnInit {
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
        label: "Devices per Day"
      }
    }
  }
  public chartData
  devicesPerDay: Array<any> = [];

  private _dates: Array<any>
  @Input() set dates(dates: Array<any>) {
    if (this._dates !== dates) {
      this._dates = dates
      this.updateChartData(dates, this._logs)
    }

  }

  private _logs: Array<any>
  @Input('logs')
  set _userLogs(userLogs: Array<any>) {
    if (this._logs !== userLogs) {
      this._logs = userLogs
      this.updateChartData(this._dates, userLogs)
    }
  }

  constructor(private engagementService: EngagementDataService) { }

  ngOnInit() { }

  private updateChartData(dates: Array<any>, userLogs: Array<any>) {

    if (dates && dates.length > 0 && userLogs && userLogs.length > 0) {

      const logs = userLogs.map(x => x.logs).reduce(function (prev, curr) { return prev.concat(curr) });
      this.devicesPerDay = [];
      for (const date of dates) {
        const devices = [];
        for (const log of logs) {
          if (new Date(log.timestamp).toDateString() === date.toDateString() && !devices.includes(log.deviceId)) {
            devices.push(log.deviceId)
          }
        }
        this.devicesPerDay.push({x: date.valueOf(), y: devices.length})
      }
      console.log(this.devicesPerDay)


      this.chartData = {
        columns: [
          ["x"].concat(dates.map(d => d.toDateString())),
          ["devices"].concat(this.devicesPerDay.map(d => d.y))
        ]
      }

      console.log("devices per day:")
      console.log(this.chartData)
      
      /*
      [{
        name: 'Devices per Day',
        data: this.devicesPerDay,
        zIndex: 1,
        color: "#004d80",
        marker: {
          fillColor: 'none',
          lineWidth: 0,
          lineColor: 'black',
          radius: 1
        }
      }]*/
    }
  }
}
