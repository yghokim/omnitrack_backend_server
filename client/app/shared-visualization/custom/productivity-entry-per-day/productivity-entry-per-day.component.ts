import { Component, Input, OnInit } from '@angular/core';
import { Chart } from 'angular-highcharts';
import { IItemDbEntity } from '../../../../../omnitrack/core/db-entity-types';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { D3Helper } from '../../d3-helper';
import * as moment from 'moment-timezone';
import * as groupArray from 'group-array';
import { merge } from '../../../../../shared_lib/utils';
import { HighChartsHelper } from '../../highcharts-helper';
import { DecodedItem } from '../productivity-dashboard/productivity-dashboard.component';

@Component({
  selector: 'app-productivity-entry-per-day',
  templateUrl: './productivity-entry-per-day.component.html',
  styleUrls: ['./productivity-entry-per-day.component.scss']
})
export class ProductivityEntryPerDayComponent implements OnInit {

  private readonly data = new BehaviorSubject<ProductivityEntryPerDayData>(null)

  @Input("decodedItems")
  set _logs(logs: Array<DecodedItem>) {
    const days = D3Helper.makeDateSequence(logs.map(l => l.dominantDate))
    const groups = days.map(day => {
      return {date: day, logs: logs.filter(l => l.dominantDateNumber === day.getTime()) }
    })

    groups.sort((a, b) => a.date.getTime() - b.date.getTime())

    const chartOptions = HighChartsHelper.makeDefaultChartOptions('column')
    chartOptions.tooltip = {
      valueSuffix: ' 개의 기록'
    }

    chartOptions.xAxis = {
      categories: days,
      labels:{
        formatter: function(){
          return moment(this.value).format("MM/DD")
        }
      }
    }
    chartOptions.yAxis = {
      allowDecimals: false,
      min: 0,
      title: {
        text: "로그 수",
        margin:5
      },
      labels: {
        padding: 0
      }
    }
    chartOptions.legend = {
      enabled: false
    }
    chartOptions.series = [{
      name: "생산성 로그",
      data: groups.map(g=>g.logs.length)
    }]

    this.chart = new Chart(chartOptions)
  }

  public chart

  constructor() { }

  ngOnInit() {
  }

}

export type ProductivityEntryPerDayData = {
  logs: Array<{ date: Date, logs: Array<DecodedItem> }>,
  days: Array<Date>
}