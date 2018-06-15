import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { EngagementDataService } from '../../experiment-overview/client-usage/engagement-data.service';
import { HighChartsHelper } from '../../shared-visualization/highcharts-helper';
import { Chart } from 'angular-highcharts';


@Component({
  selector: 'app-users-per-day',
  templateUrl: './users-per-day.component.html',
  styleUrls: ['./users-per-day.component.scss']
})
export class UsersPerDayComponent implements OnInit {
  private chart
  private logs
  private usersPerDay: Array<any> = [];
  
  @Input('dates')
  private dates: Array<any>

  @Output('usersPerDay')
  private averageUsersPerDay = new EventEmitter<number>();

  @Input('engageLog')
  set _engageLog(engageLog: Array<any>){
    console.log(engageLog)
    if(this.dates && engageLog){
      for(let date of engageLog){
        var activeUsers = 0;
        for(let element of date.dayElements){
          if(element.engagements.length > 0){
            activeUsers++;
          }
        }
        this.usersPerDay.push([date.dayElements[0].date.valueOf(), activeUsers])
      }
    }
    this.makeChart()
    var average = 0;
    for(let user of this.usersPerDay){ average += user[1] }
    if(this.usersPerDay.length !== 0){
      average = average/this.usersPerDay.length
      this.averageUsersPerDay.emit(average)
      console.log(average)
    }
  }

  constructor( private engagementService: EngagementDataService) { }

  ngOnInit() {

  }

  makeChart(){
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
      name: 'Active Users per Day',
      data: this.usersPerDay,
      zIndex: 1,
      color: "#004d80",
      marker: {
        fillColor: 'white',
        lineWidth: 1,
        lineColor: 'black',
        radius: 2
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
  }

}
