import { Component, OnInit, Input } from "@angular/core";
import { DecodedItem } from "../../../../shared-visualization/custom/productivity-helper";
import { HighChartsHelper } from "../../../../shared-visualization/highcharts-helper";
import { Chart } from "angular-highcharts";
import * as d3 from "d3";
import * as moment from "moment";
import { IParticipantDbEntity } from "../../../../../../omnitrack/core/db-entity-types";
import { groupArrayByVariable, toDurationString } from "../../../../../../shared_lib/utils";
import { getExperimentDateSequenceOfParticipant } from "../../../../../../omnitrack/experiment-utils";
import { ChartOptions } from "highcharts";

@Component({
  selector: "app-log-delay-histogram",
  templateUrl: "./log-delay-histogram.component.html",
  styleUrls: ["./log-delay-histogram.component.scss"]
})
export class LogDelayHistogramComponent implements OnInit {
  public chart;

  private delayMinutes = 10;
  private delayBinMax = 60 * 24;

  public participants: Array<IParticipantDbEntity>;
  public decodedItems: Array<DecodedItem>;

  public globalChart: Chart;
  public boxplot: Chart;

  public chartsPerParticipant: Array<{
    participant: IParticipantDbEntity;
    chart: Chart;
  }>;

  @Input("participants")
  set _participants(participants: Array<IParticipantDbEntity>) {
    this.participants = participants;
    if (this.decodedItems) {
      this.refresh(this.participants, this.decodedItems);
    }
  }

  @Input("decodedItems")
  set _decodedItems(decodedItems: Array<DecodedItem>) {
    this.decodedItems = decodedItems;
    if (this.participants) {
      this.refresh(this.participants, this.decodedItems);
    }

    /*
        const chartOptions = HighChartsHelper.makeDefaultChartOptions('histogram')
        chartOptions.series = delaySeconds
    
        this.chart = new Chart(chartOptions)*/
  }

  constructor() { }

  ngOnInit() { }

  private refresh(
    participants: Array<IParticipantDbEntity>,
    decodedItems: Array<DecodedItem>
  ) {

    const today = moment()
      .endOf("day")
      .toDate();

    let totalDelayLogs: Array<DelayLog> = [];
    const delayLogsPerParticipant: Array<{
      participant: IParticipantDbEntity;
      delayLogs: Array<DelayLog>;
      dailyAggregated: Array<DelayInfoPerDay>;
      avg: number;
      median: number;
      sd: number;
      n: number;
      q1: number;
      q3: number;
      high: number;
      low: number;
    }> = [];

    const grouped = groupArrayByVariable(decodedItems, "user");
    for (let userId of Object.keys(grouped)) {
      const decodedItemsOfParticipant: Array<DecodedItem> = grouped[userId];
      const participant = participants.find(p => p.user._id === userId);
      if (participant) {
        const daySequence = getExperimentDateSequenceOfParticipant(
          participant,
          today,
          false
        );
        const delayLogs = decodedItemsOfParticipant
          .map(decodedItem => {
            let delay;
            if (
              decodedItem.item.timestamp > decodedItem.from &&
              decodedItem.item.timestamp < decodedItem.to
            ) {
              //inside
              delay = 0;
            } else if (decodedItem.item.timestamp >= decodedItem.to) {
              //delayed
              delay = decodedItem.item.timestamp - decodedItem.to;
            } else {
              //before
              delay = decodedItem.item.timestamp - decodedItem.from;
            }
            delay = Math.round(delay / 60000);
            return {
              x: daySequence.findIndex(
                d => moment(d).isSame(decodedItem.dominantDate, "day") === true
              ),
              y: delay
            };
          })
          .filter(d => d.x >= 0).sort((a,b)=>a.y - b.y);

        const q1 = d3.quantile(delayLogs, 0.25, l => l.y)
        const q3 = d3.quantile(delayLogs, 0.75, l => l.y)
        const iqr = (q3 - q1)
        const minThreshold = q1 - 1.5*iqr
        const maxThreshold = q3 + 1.5*iqr
        //console.log(participant.alias + ": q1: " + q1 + ", q3: " + q3 + ", minThreshold:" + minThreshold + " maxThreshold:" + maxThreshold)
        const insiders = delayLogs.filter(d=>d.y >= minThreshold && d.y <= maxThreshold)


        delayLogsPerParticipant.push({
          participant: participant,
          delayLogs: delayLogs,
          dailyAggregated: this.calcDelayData(delayLogs),
          n: delayLogs.length,
          avg: d3.mean(delayLogs, l => l.y),
          median: d3.median(delayLogs, l => l.y),
          sd: d3.deviation(delayLogs, l => l.y),
          q1: q1,
          q3: q3,
          high: d3.max(insiders, l => l.y),
          low: d3.min(insiders, l => l.y)
        });
        totalDelayLogs = totalDelayLogs.concat(delayLogs);
      }
    }

    console.log(delayLogsPerParticipant);

    //Global chart========================
    const globalData = this.calcDelayData(
      delayLogsPerParticipant.reduce((a, b) => a.concat(b.dailyAggregated), [])
    );

    if (!this.globalChart) {
      const chartOptions = HighChartsHelper.makeDefaultChartOptions(
        "scatter",
        "30%"
      );
      chartOptions.xAxis = {
        title: {
          enabled: true,
          text: "Days of Experiment"
        }
      };
      chartOptions.yAxis = {
        title: {
          text: "Delay (minutes)"
        }
      };

      this.globalChart = new Chart(chartOptions);
    }

    this.globalChart.removeSerie(0);
    this.globalChart.removeSerie(0);

    this.globalChart.addSerie({
      name: "Raw Points",
      color: "rgba(0,0,0,0.05)",
      data: totalDelayLogs.map(g => [g.x, g.y])
    } as any);

    this.globalChart.addSerie({
      name: "Median",
      data: globalData.map(g => [g.x, g.y])
    } as any);

    //==========================

    //boxplot==============================
    const chartOptions = HighChartsHelper.makeDefaultChartOptions(
      "boxplot",
      "40%"
    );
    chartOptions.title = {
      text: "Delays of Logs per Participant",
      style: "font-size: 10pt"
    };

    chartOptions.legend = {
      enabled: false
    };

    chartOptions.yAxis = {
      title: {
        text: "Logging Delay (minute)"
      },
      tickInterval: 60 * 12,
      minorTickInterval: 60*6,
      labels: {
        formatter: function () {
          return toDurationString(this.value * 60)
        }
      }
    };

    chartOptions.xAxis = {
      type: "category",
      categories: delayLogsPerParticipant.map(e => e.participant.alias),
      title: {
        text: "Participant"
      }
    };

    chartOptions.series = [
      {
        name: "Delays",
        data: delayLogsPerParticipant
      }
    ];

    this.boxplot = new Chart(chartOptions);

    //=====================================

    //charts per participant ==============

    this.chartsPerParticipant = delayLogsPerParticipant.map(entry => {
      const chartOptions = HighChartsHelper.makeDefaultChartOptions(
        null,
        "40%"
      );
      chartOptions.title = {
        text: entry.participant.alias,
        style: "font-size: 9pt"
      };
      chartOptions.plotOptions = {
        areaspline: {
          enableMouseTracking: false,
          pointPlacement: "between",
          marker: {
            enabled: false
          },
          lineWidth: 0
        },
        series: {
          animation: false
        }
      };

      chartOptions.yAxis = {
        min: 0
      };

      chartOptions.series = [
        {
          name: "Median",
          type: "areaspline",
          data: entry.dailyAggregated.map(d => [d.x, d.y])
        }
      ];

      chartOptions.legend = {
        enabled: false
      };

      return {
        participant: entry.participant,
        chart: new Chart(chartOptions)
      };
    });

    //======================================
  }

  private calcDelayData(
    logs: Array<DelayLog | DelayInfoPerDay>
  ): Array<DelayInfoPerDay> {
    let result: Array<DelayInfoPerDay> = [];
    const grouped = groupArrayByVariable(logs, "x");
    for (let dayIndexString of Object.keys(grouped)) {
      const data: Array<DelayLog | DelayInfoPerDay> = grouped[dayIndexString];
      result.push({
        x: Number.parseInt(dayIndexString),
        y:
          "data" in data[0]
            ? d3.mean(data, d => d.y)
            : d3.median(data, d => d.y),
        se: d3.deviation(data, d => d.y) / Math.sqrt(data.length),
        data: data
      });
    }
    return result;
  }
}

interface DelayLog {
  x: number; // dayindex
  y: number; // delayMinutes
}

interface DelayInfoPerDay {
  x: number; // dayIndex
  y: number;
  se: number;
  data: Array<DelayLog | DelayInfoPerDay>;
}
