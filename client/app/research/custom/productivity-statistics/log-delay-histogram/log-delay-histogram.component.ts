import { Component, OnInit, Input } from '@angular/core';
import { DecodedItem } from '../../../../shared-visualization/custom/productivity-helper';
import { HighChartsHelper } from '../../../../shared-visualization/highcharts-helper';
import { Chart } from 'angular-highcharts';
import * as d3 from 'd3';

@Component({
  selector: 'app-log-delay-histogram',
  templateUrl: './log-delay-histogram.component.html',
  styleUrls: ['./log-delay-histogram.component.scss']
})
export class LogDelayHistogramComponent implements OnInit {

  public chart

  private delayMinutes = 10
  private delayBinMax = 60 * 24

  @Input() set decodedItems(decodedItems: Array<DecodedItem>){
    const delayData = decodedItems.map(decodedItem => {
      let delay
      console.log(decodedItem.dominantDateNumber)
      if(decodedItem.item.timestamp > decodedItem.from && decodedItem.item.timestamp < decodedItem.to){
        //inside
        delay = 0
      } else if(decodedItem.item.timestamp >= decodedItem.to){
        //delayed
        delay = decodedItem.item.timestamp - decodedItem.to
      }
      else{
        //before
        delay = decodedItem.item.timestamp - decodedItem.from
      }
      delay = Math.round(delay/60000)
      return {decodedItem: decodedItem, delayMinute: delay}
    })

    delayData.sort((a, b)=>{
      return a.delayMinute - b.delayMinute
    })

    console.log(delayData)

/*
    const chartOptions = HighChartsHelper.makeDefaultChartOptions('histogram')
    chartOptions.series = delaySeconds

    this.chart = new Chart(chartOptions)*/
  }

  constructor() { }

  ngOnInit() {
  }

}
