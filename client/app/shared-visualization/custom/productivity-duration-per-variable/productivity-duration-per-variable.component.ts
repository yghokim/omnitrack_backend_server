import { Component, OnInit, Input } from "@angular/core";
import { DecodedItem, ProductivityHelper } from '../productivity-dashboard/productivity-dashboard.component';
import * as d3 from "d3";
import { unique, groupArrayByVariable } from "../../../../../shared_lib/utils";
import * as groupArray from "group-array";
import { HighChartsHelper } from '../../highcharts-helper';
import { Chart } from "angular-highcharts";
import * as moment from 'moment-timezone';

@Component({
  selector: "app-productivity-duration-per-variable",
  templateUrl: "./productivity-duration-per-variable.component.html",
  styleUrls: ["./productivity-duration-per-variable.component.scss"]
})
export class ProductivityDurationPerVariableComponent implements OnInit {

  @Input() title: string

  @Input("data")
  set _decodedItems(data: {decodedItems: Array<DecodedItem>, variableName: string, isArray: boolean}) {
    const decodedItems = data.decodedItems
    const targetValues = data.isArray === true ? 
      unique(decodedItems.map(item => item[data.variableName]).reduce((flat, arr)=>{ return flat.concat(arr) }))
      : unique(decodedItems.map(item => item[data.variableName]) as any)
    
    const productivities = unique(decodedItems.map(item => item.productivity));
    productivities.sort();
    const variableGrouped = groupArrayByVariable(decodedItems, data.variableName);
    const variableBasedArray = Array<{target: string, totalDuration: number, logsPerProductivity: Array<any>}>()
    for (let target of Object.keys(variableGrouped)) {
      const totalDuration = d3.sum(variableGrouped[target], (d: any) => d.duration);
      const productivityGrouped = groupArray(variableGrouped[target], "productivity");
      const logsPerProductivity = productivities.map(productivity => {
        const arr = productivityGrouped[productivity.toString()]
        return {
          productivity: productivity,
          totalDuration: arr&&arr.length>0? d3.sum(arr,
            (i: any) => i.duration
          ) : 0
        };
      });
      variableBasedArray.push({target: target, totalDuration: totalDuration, logsPerProductivity: logsPerProductivity})
    }

    variableBasedArray.sort((a, b) => b.totalDuration - a.totalDuration )
    
    const chartOptions = HighChartsHelper.makeDefaultChartOptions('bar', '70%')
    chartOptions.xAxis = {
      categories: variableBasedArray.map(elm => elm.target)
    }

    chartOptions.yAxis = {
      type: 'linear',
      title: {text: '소요시간'},
      tickLength: 0,
      labels:{
        formatter: function(){
          return ProductivityHelper.formatDurationText(this.value)
        }
      },
      minorTicks: true,
      minorTickInterval: 1
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
        groupPadding: 0.2
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
          data: variableBasedArray.map(elm => elm.logsPerProductivity.find(l => l.productivity === productivity).totalDuration/60)
        }
      }
    )

    this.chart = new Chart(chartOptions)
  }

  public chart;

  constructor() {}

  ngOnInit() {}
}
