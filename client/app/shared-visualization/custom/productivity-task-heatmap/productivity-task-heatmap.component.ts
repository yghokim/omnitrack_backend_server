import { Component, OnInit, Input, ViewChild, ElementRef } from "@angular/core";
import {
  DecodedItem,
  ProductivityHelper
} from "../productivity-helper";
import { groupArrayByVariable } from "../../../../../shared_lib/utils";
import { HighChartsHelper } from "../../highcharts-helper";
import { Chart } from "angular-highcharts";

@Component({
  selector: "app-productivity-task-heatmap",
  templateUrl: "./productivity-task-heatmap.component.html",
  styleUrls: ["./productivity-task-heatmap.component.scss"]
})
export class ProductivityTaskHeatmapComponent implements OnInit {

  @ViewChild('chartContainer') mainContainer: ElementRef

  @Input("decodedItems")
  set _decodedItems(decodedItems: Array<DecodedItem>) {
    const productivityRange = [0, 1, 2];

    const durationBinData = ProductivityHelper.extractDurationBinsAndHistogram(
      decodedItems
    );
    const grouped = groupArrayByVariable(decodedItems, "tasks");
    const taskBasedArray: Array<{ task: string; bins: Array<any> }> = [];
    for (let task of Object.keys(grouped)) {
      const items = grouped[task];
      const binned = durationBinData.ranges.map((range, index, arr) => {
        return {
          range: range,
          from: range.from,
          to: range.to,
          logs: items.filter(item => {
            return index < arr.length - 1
              ? item.duration >= range.from && item.duration < range.to
              : item.duration >= range.from && item.duration <= range.to;
          })
        };
      });
      taskBasedArray.push({
        task: task,
        bins: binned
      });
    }

    const points = [];
    taskBasedArray.forEach((taskRow, x) => {
      taskRow.bins.forEach((yBin, y) => {
        points.push([x, y, yBin.logs.length]);
      });
    });

    const chartOptions = HighChartsHelper.makeDefaultChartOptions("heatmap", this.getChartHeightParam(this.mainContainer.nativeElement.clientWidth));

    chartOptions.xAxis = {
      categories: taskBasedArray.map(elm => elm.task)
    };

    chartOptions.yAxis = {
      title: null,
      categories: durationBinData.ranges.map(range =>
        ProductivityHelper.timeRangeToText(range)
      )
    };

    chartOptions.colorAxis = {
      min: 0,
      minColor: '#FFFFFF',
      maxColor: chartOptions.colors[0]
    },

    chartOptions.series = [
      {
        name: "",
        data: points,
        dataLabels: {
          enabled: true,
          color: "#757575"
        }
      }
    ];

    chartOptions.tooltip = {
      formatter: function(){
        return "<b>" + taskBasedArray[this.point.x].task +"</b><br>" + this.point.value + "개의 기록"
      }
    }

    chartOptions.legend = {
      enabled: false
    }

    this.chart = new Chart(chartOptions);
  }

  public chart: Chart

  constructor() {}

  ngOnInit() {
    this.onWidth(this.mainContainer.nativeElement.clientWidth)
  }

  containerSizeChanged(event: any){
    this.onWidth(this.mainContainer.nativeElement.clientWidth)
  }

  onWidth(width: number){
    this.chart.options.chart.height = this.getChartHeightParam(width)
  }

  private getChartHeightParam(width: number){
    return width >= 500? "40%" : null
  }


}
