import { Component, OnInit, Input } from '@angular/core';
import { IItemDbEntity } from '../../../../../omnitrack/core/db-entity-types';
import { DecodedItem, ProductivityHelper } from '../productivity-helper';
import * as d3 from 'd3';
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

    const extractedDurationHistogram = ProductivityHelper.extractDurationBinsAndHistogram(decodedItems)

    const series = []
    const productivityGrouped = groupArray(decodedItems, "productivity")
    for (let productivity of Object.keys(productivityGrouped)) {
      const completeBins = extractedDurationHistogram.ranges.map((range, completeBinIndex, arr) => {
        
        const bin = productivityGrouped[productivity].filter(item => {
          return completeBinIndex === arr.length -1? range.from <= item.duration && range.to >= item.duration : range.from <= item.duration && range.to > item.duration
        })
        return bin ? bin.length : 0
      })

      var productivityColor = ProductivityHelper.getProductivityColor(Number.parseInt(productivity))
      var productivityLabel = ProductivityHelper.getProductivityLabel(Number.parseInt(productivity))

      series.push({
        name: productivityLabel,
        data: completeBins,
        color: productivityColor
      })
    }
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
      categories: extractedDurationHistogram.ranges.map(range => ProductivityHelper.timeRangeToText(range))
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
      },
      minorTicks: true,
      minorTickInterval: 1
    }
    chartOptions.series = series

    this.chart = new Chart(chartOptions)
  }



  public chart

  constructor() { }

  ngOnInit() {
  }

}