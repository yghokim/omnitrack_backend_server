import { Component, OnInit, Input } from '@angular/core';
import { HighChartsHelper } from '../../../shared-visualization/highcharts-helper';
import { Chart } from 'angular-highcharts';
import { IUsageLogDbEntity } from '../../../../../omnitrack/core/db-entity-types';
import d3 = require('d3');

@Component({
  selector: 'app-daily-average',
  templateUrl: './daily-average.component.html',
  styleUrls: ['./daily-average.component.scss']
})
export class DailyAverageComponent implements OnInit {
  
  public chart
  private usageLog: Array<any>
  private dates: Array<any> = []
  private engageLog: Array<any>
  
  @Input('dataType')
  private dataType: String

  @Input("engageLog")
  set _engageLog(engageLog: Array<any>){
    if(engageLog.length > 0){
      this.engageLog = engageLog;
      this.updateDates()
      const chartOptions = HighChartsHelper.makeDefaultChartOptions()
      var countsAverages = [];
      var durationAverages = [];

      for(let date of this.dates){
        var counts = []
        var durations = []
        for(let user of engageLog){
          var count = 0;
          var duration = 0;
          for(let engagement of user.engagements){
            if(date.getDate() === engagement.start.getDate()){
              if(this.dataType === "launchCount"){
                count++
              }
              if(this.dataType === "sessionEngagement"){
                duration += engagement.duration
              }
            }
          }
          counts.push(count)
          durations.push(duration)
        }
        var countSum = 0;
        var durationSum = 0;
        for(var i: number = 0; i < counts.length ; i++){
          countSum += counts[i]
          durationSum += durations[i]
        }
        countsAverages.push(Math.round((countSum / engageLog.length)*10)/10)
        var minuteDate = new Date(Math.round((durationSum/ engageLog.length)*10)/10);
        durationAverages.push(minuteDate.getMinutes())
      }

      chartOptions.xAxis = {
        categories: this.dates.map(x => x.toDateString())
      }

      if(this.dataType === "launchCount"){
        chartOptions.series = [
          {
          name: 'Average number of launches',
          data: countsAverages
          }
        ];
        
        chartOptions.yAxis = {
          min: 0,
          title: {
            text: "Average number of launches",
            margin: 5
          }
        }
      }
  
      else if(this.dataType === "sessionEngagement"){      
        chartOptions.series = [
          {
          name: 'Average session duration',
          data: durationAverages
          }
        ];
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