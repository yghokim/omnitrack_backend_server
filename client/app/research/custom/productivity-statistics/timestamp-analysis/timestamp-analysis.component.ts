import { Component, OnInit, Input } from '@angular/core';
import { DecodedItem } from '../../../../shared-visualization/custom/productivity-helper';
import { IParticipantDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import { HighChartsHelper } from '../../../../shared-visualization/highcharts-helper';
import { Chart } from 'angular-highcharts';
import { getExperimentDateSequenceOfParticipant } from '../../../../../../omnitrack/experiment-utils';
import * as moment from 'moment';

@Component({
  selector: 'app-timestamp-analysis',
  templateUrl: './timestamp-analysis.component.html',
  styleUrls: ['./timestamp-analysis.component.scss']
})
export class TimestampAnalysisComponent implements OnInit {

  public scatterPlot: Chart

  decodedItemsPerParticipant: Array<{ participant: any, decodedItems: Array<DecodedItem>, weekdayLogs: Array<DecodedItem>, weekendLogs: Array<DecodedItem> }>

  @Input("data")
  set setData(decodedItemsPerParticipant: Array<{ participant: any, decodedItems: Array<DecodedItem>, weekdayLogs: Array<DecodedItem>, weekendLogs: Array<DecodedItem> }>) {
    this.decodedItemsPerParticipant = decodedItemsPerParticipant

    let data = []
    decodedItemsPerParticipant.forEach((participantRow, participantIndex)=>{
      const sequence = getExperimentDateSequenceOfParticipant(participantRow.participant, new Date(), true).slice(0,16).map(d=>moment(d))
      const initialPoint = moment(sequence[0])
      data = data.concat(participantRow.decodedItems.map(item=>{
        return {
          x: sequence.findIndex(d=>d.isSame(moment(item.item.timestamp), 'day')===true) + item.timestampDayRatio,
          y: participantIndex,
          z: item}
      }))
    })

    const chartOptions = HighChartsHelper.makeDefaultChartOptions('scatter')

    chartOptions.title = { 
      text: "Logging Timestamp Timeline (Relative)",
      style: 'font-size:16px'
     }

    chartOptions.yAxis = {
      type: 'category',
      title: {text: null},
      categories: decodedItemsPerParticipant.map(d => d.participant.alias)
    }

    chartOptions.xAxis = {
      title: { text: "Experimental Days" },
      startOnTick: true,
      endOnTick: true,
      showLastLabel: true,
      gridLineWidth: 1,
      tickInterval: 1,
      gridLineColor: "#bbb",

      minorTickInterval: 0.5
    }

    chartOptions.plotOptions = {
      scatter: {
        marker: {
            radius: 5
        },
        tooltip: {
          pointFormatter: function(){
            return moment(this.z.item.timestamp).format('YYYY-MM-DD') + "<br>" + this.z.rationale
          }
        }
      }
    }

    chartOptions.series = [
      {
        name: 'timestamp',
        color: "rgba(46, 198, 198, 0.2)",
        data: data
      }
    ]

    this.scatterPlot = new Chart(chartOptions)
  }

  constructor() { }

  ngOnInit() {
  }

}
