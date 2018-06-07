import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { HighChartsHelper } from '../../../shared-visualization/highcharts-helper';
import { Chart } from 'angular-highcharts';
import { IUsageLogDbEntity } from '../../../../../omnitrack/core/db-entity-types';
import d3 = require('d3');
import { Engagement } from '../client-usage.component';
import Highcharts = require('highcharts');
import { EngagementDataService } from '../engagement-data.service';

@Component({
  selector: 'app-daily-average',
  templateUrl: './daily-average.component.html',
  styleUrls: ['./daily-average.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailyAverageComponent implements OnInit {
  
  public chart
  private engageLog: Array<DayData>
  
  @Input('dataType')
  private dataType: String

  @Input('dates')
  private dates: Array<any>

  @Input("engageLog")
  set _engageLog(engageLog: Array<DayData>){
    if(engageLog.length > 0){
      const chartOptions = HighChartsHelper.makeDefaultChartOptions('line', "40%")

      chartOptions.xAxis = {
        type: 'datetime',
        categories: this.dates,
        crosshair: {
          width: 2 
        }
      }        
      chartOptions.tooltip = {
          shared: true,
          valueDecimals: 2
      }
  
      if(this.dataType === "launchCount"){

        chartOptions.series = [{
          name: 'Average app-launches',
          data: engageLog.map( x => x.avgCount),
          zIndex: 1,
          color: "#004d80",
          marker: {
            fillColor: 'white',
            lineWidth: 2,
            lineColor: 'black'
          }
        },{
          name: 'Range' ,
          data: engageLog.map(x => [x.minCount,x.maxCount]),
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
        chartOptions.yAxis = {
          min: 0,
          title: {
            text: "Average number of launches",
            margin: 5
          },
          minorTickInterval: 10,
          tickInterval: 20
        }
      }
  
      else if(this.dataType === "sessionEngagement"){   
        
        chartOptions.series = [{
          name: 'Average session duration',
          data: engageLog.map( x => x.avgDuration),
          zIndex: 1,
          marker: {
            fillColor: 'white',
            lineWidth: 2,
            lineColor: '#84315d'
          }
        },{
          name: 'Range' ,
          data: engageLog.map(x => [x.minDuration,x.maxDuration]),
          type: 'arearange',
          lineWidth: 0,
          fillOpacity: 0.3,
          zIndex: 0,
          marker: {
            enabled: false
          }
        }
        ];
        chartOptions.yAxis = {
          min: 0,
          title: {
            text: "Average session duration (min)",
            margin: 5
          },
          minorTickInterval: 10,
          tickInterval: 20
        }
      }
      else{ console.log("Not defined chartDataType")}
      this.chart = new Chart(chartOptions);
  
    }
  }

  constructor() { }

  ngOnInit() {
    
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