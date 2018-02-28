import { Component, OnInit, Input } from "@angular/core";
import { DecodedItem, ProductivityHelper } from '../productivity-dashboard/productivity-dashboard.component';
import d3 = require("d3");
import { unique } from "../../../../../shared_lib/utils";
import * as groupArray from "group-array";
import { HighChartsHelper } from '../../highcharts-helper';
import { Chart } from "angular-highcharts";
import * as moment from 'moment-timezone';

@Component({
  selector: "app-productivity-duration-per-location",
  templateUrl: "./productivity-duration-per-location.component.html",
  styleUrls: ["./productivity-duration-per-location.component.scss"]
})
export class ProductivityDurationPerLocationComponent implements OnInit {
  @Input("decodedItems")
  set _decodedItems(decodedItems: Array<DecodedItem>) {
    const locations = unique(decodedItems.map(item => item.location) as any);
    const productivities = unique(decodedItems.map(item => item.productivity));
    productivities.sort();
    const locationGrouped = groupArray(decodedItems, "location");
    const locationBasedArray = Array<{location: string, totalDuration: number, logsPerProductivity: Array<any>}>()
    for (let location of Object.keys(locationGrouped)) {
      const totalDuration = d3.sum(locationGrouped[location], (d: any) => d.duration);
      const productivityGrouped = groupArray(locationGrouped[location], "productivity");
      console.log(productivityGrouped);
      const logsPerProductivity = productivities.map(productivity => {
        const arr = productivityGrouped[productivity.toString()]
        return {
          productivity: productivity,
          totalDuration: arr&&arr.length>0? d3.sum(arr,
            (i: any) => i.duration
          ) : 0
        };
      });
      console.log(logsPerProductivity);
      locationBasedArray.push({location: location, totalDuration: totalDuration, logsPerProductivity: logsPerProductivity})
    }

    locationBasedArray.sort((a, b) => b.totalDuration - a.totalDuration )
    console.log(locationBasedArray)
    
    const chartOptions = HighChartsHelper.makeDefaultChartOptions('bar', '70%')
    chartOptions.xAxis = {
      categories: locations
    }

    chartOptions.yAxis = {
      type: 'linear',
      title: {text: '소요시간'},
      tickLength: 0,
      labels:{
        formatter: function(){
          return ProductivityHelper.formatDurationText(this.value)
        }
      }
    }

    chartOptions.tooltip = {
      formatter: function(){
        return "<b>" + this.x +"</b>" + ": "
           + ProductivityHelper.formatDurationText(this.y)
           + "("+this.series.name+")"
      }
    }
    
    chartOptions.plotOptions = {
      bar: {
        stacking: 'normal'
      },
      series: {
        groupPadding: 0
      }
    }
    
    chartOptions.legend = {
      enabled: false
    }

    chartOptions.series = productivities.map(
      productivity => {
        return {
          name: ProductivityHelper.getProductivityLabel(productivity),
          color: ProductivityHelper.getProductivityColor(productivity),
          data: locationBasedArray.map(elm => elm.logsPerProductivity.find(l => l.productivity === productivity).totalDuration/60)
        }
      }
    )

    this.chart = new Chart(chartOptions)
  }

  public chart;

  constructor() {}

  ngOnInit() {}
}
