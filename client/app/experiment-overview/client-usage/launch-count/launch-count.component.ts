import { Component, OnInit, Input } from '@angular/core';
import { HighChartsHelper } from '../../../shared-visualization/highcharts-helper';
import { Chart } from 'angular-highcharts';

@Component({
  selector: 'app-launch-count',
  templateUrl: './launch-count.component.html',
  styleUrls: ['./launch-count.component.scss']
})
export class LaunchCountComponent implements OnInit {
  
  public chart
  public MIN_SESSION_GAP: number = 1000;
  private logs: Array<any>
  private dates: Array<any>
  private dailyCounts: Array<number>

  @Input('usageLog')
  set _usageLog(usageLog: Array<any>){
    if(usageLog){
      this.logs = usageLog;
      //find min/max Date over all users
      var minDate = 10000000000000;
      var maxDate = 0;

      for(let entry of usageLog){
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
     console.log("Min Date: " + new Date(minDate) + " Max Date: " + new Date(maxDate));
      //construct date array with all days inbetween min and max
      this.dates = [];
      this.dailyCounts = [];
      this.dates[0] = new Date(minDate).toDateString();
      console.log(this.dates[0]);
      var currentDate = new Date(minDate);
      for(var i: number = 1; currentDate < new Date(maxDate); i++){
        var helper = currentDate;
        currentDate.setDate(helper.getDate()+1);
        this.dates[i] = new Date(currentDate).toDateString();
      }
      console.log(this.dates)
      //iterate over all days, users, logs and increment the users daily logCount

      for(let date of this.dates){
        var dailyResult = 0;
        var userCounts: Array<number> = [];
        for(let user of usageLog){
          var useCount = 0;
          var i = 0;
          for(let log of user.logs){
            if(log.content){
              var day = new Date(log.content.finishedAt).toDateString();
              if(day === date){
                if(i === 0){ useCount ++;}
                else if(user.logs[i-1].content.finishedAt < log.content.finishedAt - log.content.elapsed - this.MIN_SESSION_GAP){
                  useCount++;
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
        var average = dailyResult / usageLog.length;
        this.dailyCounts.push(average);
      }
      
      //visualize average per day
      console.log(this.dailyCounts);

      const chartOptions = HighChartsHelper.makeDefaultChartOptions()
    
    
      chartOptions.series = [
        {
        name: 'Average Number of Logs',
        data: this.dailyCounts
        }
      ];
      chartOptions.xAxis = {
        categories: this.dates
      }
      chartOptions.yAxis = {
        min: 0,
        title: {
          text: "Average log count",
          margin: 5
        }
      }
      this.chart = new Chart(chartOptions);
    }
  }

  constructor() { }

  ngOnInit() {
    
  }

}