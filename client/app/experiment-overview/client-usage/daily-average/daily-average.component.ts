import { Component, OnInit, Input } from '@angular/core';
import { HighChartsHelper } from '../../../shared-visualization/highcharts-helper';
import { Chart } from 'angular-highcharts';

@Component({
  selector: 'app-daily-average',
  templateUrl: './daily-average.component.html',
  styleUrls: ['./daily-average.component.scss']
})
export class DailyAverageComponent implements OnInit {
  
  public chart
  public MIN_SESSION_GAP: number = 1000;
  private logs: Array<any>
  private dates: Array<any>
  private dailyCounts: Array<number>

  @Input('dataType')
  private dataType: String

  @Input('usageLog')
  set _usageLog(usageLog: Array<any>){
    if(usageLog && this.dataType){
      this.logs = usageLog;
      this.updateDates();
      const chartOptions = HighChartsHelper.makeDefaultChartOptions()

      if(this.dataType === "launchCount"){
        this.countLaunches()
        chartOptions.series = [
          {
          name: 'Average number of launches',
          data: this.dailyCounts
          }
        ];
        chartOptions.xAxis = {
          categories: this.dates
        }
        chartOptions.yAxis = {
          min: 0,
          title: {
            text: "Average number of launches",
            margin: 5
          }
        }
      }

      else if(this.dataType === "sessionEngagement"){      
        this.countDuration()
        chartOptions.series = [
          {
          name: 'Average session duration',
          data: this.dailyCounts
          }
        ];
        chartOptions.xAxis = {
          categories: this.dates
        }
        chartOptions.yAxis = {
          min: 0,
          title: {
            text: "Average session duration (min)",
            margin: 5
          }
        }
      }
      else{}
      this.chart = new Chart(chartOptions);
    }
  }

  constructor() { }

  ngOnInit() {
    
  }

  updateDates(){
    //find min/max Date over all users
    var minDate = 10000000000000;
    var maxDate = 0;

    for(let entry of this.logs){
      var max = entry.logs.find(function(x) {
        if(x.content){return x}
      }).content.finishedAt;
      if( max > maxDate){
        maxDate = max;
      }
      var min: number;
      for(var i: number = entry.logs.length-1; i >= 0; i--){
        var temp = entry.logs[i];
        if(temp && temp.content){
          min = temp.content.finishedAt - temp.content.elapsed;
          break;
        }
      }
      if(min < minDate){
        minDate = min;
      }
    }
    //construct date array with all days inbetween min and max
    this.dates = [];
    this.dailyCounts = [];
    this.dates[0] = new Date(minDate).toDateString();
    var currentDate = new Date(minDate);
    for(var i: number = 1; currentDate.getDate() < new Date(maxDate).getDate(); i++){
      var helper = currentDate;
      currentDate.setDate(helper.getDate()+1);
      this.dates[i] = new Date(currentDate).toDateString();
    }
  }

  countLaunches(){
    //iterate over all days, users, logs and increment the users daily logCount
    for(let date of this.dates){
      var dailyResult = 0;
      var userCounts: Array<number> = [];
      for(let user of this.logs){
        var useCount = 0;
        var firstCheck = 0;
        for(var i: number = user.logs.length -1; i >= 0; i--){
          var log = user.logs[i];
          if(log.content){
            var day = new Date(log.content.finishedAt).toDateString();
            if(day === date){
              firstCheck++;
              var start = log.content.finishedAt - log.content.elapsed
              if(firstCheck === 1){ useCount ++; } 
              else{
                var previous = 0;
                if(user.logs[i+1].content){
                  previous = user.logs[i+1].content.finishedAt 
                }
                if(previous < start - this.MIN_SESSION_GAP){
                  useCount++;
                }
              }
            }
          }
        }
        userCounts.push(useCount);
      }
    //for every day calculate average and put in average array
    for(let count of userCounts){
      dailyResult += count;
    }
    var average = Math.round((dailyResult / this.logs.length)*10)/10;
    this.dailyCounts.push(average);
    }
  }

  countDuration(){
    //iterate over all days, users, logs, find the first and last logs per day per user, substract the gaps from this duration
    for(let date of this.dates){
      var dailyResult = 0;
      var userCounts: Array<number> = [];
      for(let user of this.logs){
        var gaps = 0;
        var firstCheck = 0;
        var dailyStart = 0;
        var dailyEnd = 0;
        for(var i: number = user.logs.length -1; i >= 0; i--){
          var log = user.logs[i];
          if(log.content){
            var day = new Date(log.content.finishedAt).toDateString();
            if(day === date){
              var start = log.content.finishedAt - log.content.elapsed
              if(firstCheck === 0){ 
                dailyStart = start;
                firstCheck++;
              } 
              else{
                var previous = start;
                previous = user.logs.find(function(x, k){
                  if(k < i+1){}
                  else if(x.content && new Date(x.content.finishedAt).toDateString() === date){return x}
                }).content.finishedAt 
                if( previous < start - this.MIN_SESSION_GAP){
                  gaps += (start - previous);
                }
              }
              var lastLog = user.logs.find(function(x){
                if(x.content && new Date(x.content.finishedAt).toDateString() === date){return x}
              })
              if(log === lastLog){
                dailyEnd = log.content.finishedAt;
              }
            }
          }
        }
        userCounts.push(dailyEnd - dailyStart - gaps);
      }

      //for every day calculate average and put in average array
      for(let count of userCounts){
        dailyResult += count;
      }
      var average = Math.round((dailyResult / this.logs.length)*10)/10;
      var minuteDate = new Date(average);
      this.dailyCounts.push(minuteDate.getMinutes());
    }
  }

}