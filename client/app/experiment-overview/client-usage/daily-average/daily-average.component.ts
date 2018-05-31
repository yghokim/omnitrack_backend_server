import { Component, OnInit, Input } from '@angular/core';
import { HighChartsHelper } from '../../../shared-visualization/highcharts-helper';
import { Chart } from 'angular-highcharts';
import { IUsageLogDbEntity } from '../../../../../omnitrack/core/db-entity-types';
import d3 = require('d3');
import { Engagement } from '../client-usage.component';
import Highcharts = require('highcharts');

@Component({
  selector: 'app-daily-average',
  templateUrl: './daily-average.component.html',
  styleUrls: ['./daily-average.component.scss']
})
export class DailyAverageComponent implements OnInit {
  
  public chart
  private dates: Array<any> = []
  private engageLog: Array<any>
  private dailyData: Array<DayData> = []
  
  @Input('dataType')
  private dataType: String

  @Input("engageLog")
  set _engageLog(engageLog: Array<any>){
    if(engageLog.length > 0){
      this.engageLog = engageLog;
      this.updateDates()
      const chartOptions = HighChartsHelper.makeDefaultChartOptions('line')
      this.dailyData = []

      for(let date of this.dates){
        var dailyUsers: DayData = {dayElements: []}
        for(let user of engageLog){
          var count = 0;
          var duration = 0;
          var userData: DayElement = {date: date, user: user.user, engagements: []}
          for(let engagement of user.engagements){
            if(date.getDate() === engagement.start.getDate()){
              userData.engagements.push(engagement)
                count++
                duration += engagement.duration
            }
          }
          userData.launchCount = count
          userData.totalDuration = duration
          dailyUsers.dayElements.push(userData)
        }
        this.dailyData.push(dailyUsers)
        var countSum = 0;
        var durationSum = 0;
        for(var i: number = 0; i < dailyUsers.dayElements.length ; i++){
          countSum += dailyUsers.dayElements[i].launchCount
          durationSum += dailyUsers.dayElements[i].totalDuration
        }
        dailyUsers.avgCount = Math.round((countSum / engageLog.length)*10)/10
        var avgDate = Math.round((durationSum/ engageLog.length)*10)/10
        dailyUsers.avgDuration = avgDate / 60000

        var countMap = dailyUsers.dayElements.map(x => x.launchCount)
        var durMap = dailyUsers.dayElements.map(x => (x.totalDuration /60000))

        dailyUsers.maxCount = d3.max(countMap)
        dailyUsers.minCount = d3.min(countMap)
        dailyUsers.maxDuration = d3.max(durMap)
        dailyUsers.minDuration = d3.min(durMap)
      }
      console.log(this.dailyData)

      chartOptions.xAxis = {
        type: 'datetime',
        categories: this.dates.map(x => x.toDateString()),
        crosshair: {
          width: 2 
        }
      }

      if(this.dataType === "launchCount"){

        chartOptions.title = {
          text: 'Daily Average Launches'
        }
        chartOptions.series = [{
          name: 'Average app-launches per day',
          data: this.dailyData.map( x => x.avgCount),
          zIndex: 1,
          marker: {
            fillColor: 'white',
            lineWidth: 2,
            lineColor: '#84315d'
          }
        },{
          name: 'Range' ,
          data: this.dailyData.map(x => [x.minCount,x.maxCount]),
          type: 'arearange',
          lineWidth: 0,
          linkedTo: ':previous',
          fillOpacity: 0.3,
          zIndex: 0,
          marker: {
            enabled: false
          }
        }
        ];
        chartOptions.tooltip = {
          crosshairs: {
            width: 2
          },
          shared: true
        },
        
        chartOptions.yAxis = {
          min: 0,
          title: {
            text: "Average number of launches",
            margin: 5
          }
        }
      }
  
      else if(this.dataType === "sessionEngagement"){      
        chartOptions.series = [{
          name: 'Average session duration',
          data: this.dailyData.map( x => x.avgDuration),
          zIndex: 1,
          marker: {
            fillColor: 'white',
            lineWidth: 2,
            lineColor: '#84315d'
          }
        },{
          name: 'Range' ,
          data: this.dailyData.map(x => [x.minDuration,x.maxDuration]),
          type: 'arearange',
          lineWidth: 0,
          fillOpacity: 0.3,
          zIndex: 0,
          marker: {
            enabled: false
          }
        }
        ];
        chartOptions.tooltip = {
          shared: true
        },
        chartOptions.yAxis = {
          min: 0,
          title: {
            text: "Average session duration (min)",
            margin: 5
          }
        }
      }
      else{ console.log("Not defined chartDataType")}
      this.chart = new Chart(chartOptions);
  
    }
  }

  constructor() { }

  ngOnInit() {
    
  }

  updateDates(){
    //find min/max Date over all users
    var filteredLog = this.engageLog.map(function(users){if(users.engagements){return users.engagements}});
    if(filteredLog && filteredLog.length > 0){
      var reducedLog = filteredLog.reduce(function(prev,curr){ return prev.concat(curr)});
      var maxDate = d3.max(reducedLog.map(x => x.start + x.duration));
      var minDate = d3.min(reducedLog.map(x => x.start));
      //construct date array with all days inbetween min and max
      this.dates = [];
      this.dates[0] = new Date(minDate)
      var currentDate = new Date(minDate);
      for(var i: number = 1; currentDate.getDate() < new Date(maxDate).getDate(); i++){
        var helper = currentDate;
        currentDate.setDate(helper.getDate()+1);
        this.dates[i] = new Date(currentDate)
      }
    }
  }
}

export interface DayElement{
  date: Date,
  user: String,
  engagements?: Array<Engagement>,
  launchCount?: number,
  totalDuration?: number
}
export interface DayData{
  dayElements: Array<DayElement>,
  avgCount?: number,
  avgDuration?: number,
  maxCount?: number,
  maxDuration?: number,
  minCount?: number,
  minDuration?: number
}