import { Component, OnInit, Input } from '@angular/core';
import { IItemDbEntity } from '../../../../../omnitrack/core/db-entity-types';
import { DecodedItem } from '../productivity-dashboard/productivity-dashboard.component';
import d3 = require('d3');
import { Chart } from 'angular-highcharts';
import { merge } from '../../../../../shared_lib/utils';
import { HighChartsHelper } from '../../highcharts-helper';
import { ChartOptions } from 'highcharts';
import * as groupArray from 'group-array';

@Component({
  selector: 'app-productivity-duration-stacked-bar-chart',
  templateUrl: './productivity-duration-stacked-bar-chart.component.html',
  styleUrls: ['./productivity-duration-stacked-bar-chart.component.scss']
})
export class ProductivityDurationStackedBarChartComponent implements OnInit {

  @Input('decodedItems')
  set _decodedItems(decodedItems: Array<DecodedItem>) {
    console.log(decodedItems)
    const durationRange = d3.extent<number>(decodedItems.map(d => d.duration))

    const maxTickCount = 10
    var currentTickUnit = 0.5
    while ((durationRange[1] / 60) / currentTickUnit > maxTickCount - 1) {
      currentTickUnit *= 2
    }
    var numTicks = 1
    while (durationRange[1] / 60 >= numTicks * currentTickUnit) {
      numTicks++
    }

    console.log("tickUnit: " + currentTickUnit + ", numTicks: " + numTicks)
    const binBounds = d3.range(0, 60 * (numTicks + 1) * currentTickUnit, currentTickUnit * 60)

    const durationRanges = Array<{ from: number, to: number }>()
    for (let i = 0; i < binBounds.length - 1; i++) {
      durationRanges.push({ from: binBounds[i], to: binBounds[i + 1] })
    }

    const hist = d3.histogram<DecodedItem, number>().value((d, i, data) => d.duration).thresholds(binBounds)


    const series = []
    const productivityGrouped = groupArray(decodedItems, "productivity")
    console.log(productivityGrouped)
    for (let productivity of Object.keys(productivityGrouped)) {
      const binned = hist(productivityGrouped[productivity])

      const completeBins = durationRanges.map(range => {
        const bin = binned.find((bin) => Math.abs(bin.x0 - range.from) < 0.00001)
        return bin ? bin.length : 0
      })

      var productivityColor = ""
      var productivityLabel = ""
      switch (productivity.toString()) {
        case "0":
          productivityLabel = "보통"
          productivityColor = "rgb(243, 220, 117)"
          break;
        case "1":
          productivityLabel = "생산적"
          productivityColor = "rgb(91, 189, 146)"
          break;
        case "2":
          productivityLabel = "매우 생산적"
          productivityColor = "rgb(35, 135, 160)"
          break;
      }

      series.push({
        name: productivityLabel,
        data: completeBins,
        color: productivityColor
      })
    }

    console.log(series)

    const chartOptions = HighChartsHelper.makeDefaultChartOptions('column')

    chartOptions.tooltip = {
      valueSuffix: ' 개의 기록'
    }
    chartOptions.legend = {
      enabled: false
    }
    chartOptions.plotOptions = {
      column: {
        stacking: 'normal'
      },
      series: {
        groupPadding: 0
      }
    }

    chartOptions.xAxis = {
      categories: durationRanges.map(range => {
        if (range.from <= 0) {
          return "<" + (range.to / 60).toFixed(1) + "시간"
        } else {
          return (range.from / 60).toFixed(1) + " ~ " + (range.to / 60).toFixed(1) + "시간"
        }
      })
    }
    chartOptions.yAxis = {
      allowDecimals: false,
      min: 0,
      title: {
        text: "로그 수",
        margin: 5
      },
      labels: {
        padding: 0
      }
    }
    chartOptions.series = series

    this.chart = new Chart(chartOptions)
  }



  public chart

  constructor() { }

  ngOnInit() {
  }

}