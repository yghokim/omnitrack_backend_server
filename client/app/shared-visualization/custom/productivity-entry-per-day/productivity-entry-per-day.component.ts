import { Component, Input, OnInit } from '@angular/core';
import { Chart } from 'angular-highcharts';
import { IItemDbEntity } from '../../../../../omnitrack/core/db-entity-types';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { D3Helper } from '../../d3-helper';
import * as moment from 'moment-timezone';
import * as groupArray from 'group-array';

@Component({
  selector: 'app-productivity-entry-per-day',
  templateUrl: './productivity-entry-per-day.component.html',
  styleUrls: ['./productivity-entry-per-day.component.scss']
})
export class ProductivityEntryPerDayComponent implements OnInit {

  private readonly data = new BehaviorSubject<ProductivityEntryPerDayData>(null)

  @Input("logs")
  set _logs(logs: Array<ProductivityEntryPerDay>) {
    const days = D3Helper.makeDateSequence(logs.map(l => l.date))
    console.log(days)
    const groups = days.map(day => {
      return {date: day, logs: logs.filter(l => l.dateNumber === day.getTime()) }
    })

    groups.sort((a, b) => a.date.getTime() - b.date.getTime())
    console.log(groups)

    this.chart = new Chart({
      chart: { type: 'column', height: '70%' },
      title: {
        text: '',
        style: {
          display: 'none'
        }
      }, 
      subtitle: {
        text: '',
        style: {
          display: 'none'
        }
      },
      colors: ['#84315d'],
      credits: { enabled: false },
      tooltip: {
        valueSuffix: ' 개의 기록'
      },
      xAxis: {
        categories: days,
        labels:{
          formatter: function(){
            return moment(this.value).format("MM/DD")
          }
        }
      },
      yAxis: {
        allowDecimals: false,
        min: 0,
        title: {
          text: "로그 수",
          margin:5
        },
        labels: {
          padding: 0
        }
      },
      legend: {
        enabled: false
      },
      series: [{
        name: "생산성 로그",
        data: groups.map(g=>g.logs.length)
      }],
    })
  }

  public chart

  constructor() { }

  ngOnInit() {
  }

}

export type ProductivityEntryPerDayData = {
  logs: Array<{ date: Date, logs: Array<ProductivityEntryPerDay> }>,
  days: Array<Date>
}

export type ProductivityEntryPerDay = {
  item: IItemDbEntity,
  date: Date,
  dateNumber: number
}