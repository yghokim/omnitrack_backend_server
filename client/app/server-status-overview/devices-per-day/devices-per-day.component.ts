import { Component, OnInit, Input } from '@angular/core';
import { HighChartsHelper } from '../../shared-visualization/highcharts-helper';
import { Chart } from 'angular-highcharts';
import { EngagementDataService } from '../../experiment-overview/client-usage/engagement-data.service';

@Component({
  selector: 'app-devices-per-day',
  templateUrl: './devices-per-day.component.html',
  styleUrls: ['./devices-per-day.component.scss']
})
export class DevicesPerDayComponent implements OnInit {
  private chart
  private logs
  private devicesPerDay: Array<any> = [];

  @Input() private dates: Array<any>

  @Input('logs')
  set _userLogs(userLogs: Array<any>) {
    if (this.dates && userLogs && userLogs.length > 0) {
      this.logs = userLogs.map(x => x.logs).reduce(function (prev, curr) { return prev.concat(curr) });
      this.devicesPerDay = [];
      for (const date of this.dates) {
        const devices = [];
        for (const log of this.logs) {
          if (new Date(log.timestamp).toDateString() === date.toDateString() && !devices.includes(log.deviceId)) {
            devices.push(log.deviceId)
          }
        }
        this.devicesPerDay.push([date.valueOf(), devices.length])
      }
      console.log(this.devicesPerDay)
    }
    this.makeChart()
  }

  constructor(private engagementService: EngagementDataService) { }

  ngOnInit() {

  }

  makeChart() {
    const chartOptions = HighChartsHelper.makeDefaultChartOptions('line')

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
    }]
    chartOptions.yAxis = {
      min: 0,
      title: {
        text: "Devices",
        margin: 5
      },
    }
    this.chart = new Chart(chartOptions);
  }

}
