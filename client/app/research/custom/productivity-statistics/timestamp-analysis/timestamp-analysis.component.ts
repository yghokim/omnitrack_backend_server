import { Component, OnInit, Input } from '@angular/core';
import { DecodedItem } from '../../../../shared-visualization/custom/productivity-helper';
import { IParticipantDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import { HighChartsHelper } from '../../../../shared-visualization/highcharts-helper';
import { Chart } from 'angular-highcharts';
import { getExperimentDateSequenceOfParticipant } from '../../../../../../omnitrack/experiment-utils';
import * as moment from 'moment';
import * as d3 from 'd3';

@Component({
  selector: 'app-timestamp-analysis',
  templateUrl: './timestamp-analysis.component.html',
  styleUrls: ['./timestamp-analysis.component.scss']
})
export class TimestampAnalysisComponent implements OnInit {

  public scatterPlot: Chart

  decodedItemsPerParticipant: Array<{ participant: any, decodedItems: Array<DecodedItem>, weekdayLogs: Array<DecodedItem>, weekendLogs: Array<DecodedItem> }>

  public clusterSummary = new Array<{participant: any, itemCount: number, clusterCount: number, clusteredItemCount: number}>()

  public meanClusteredRatio: number
  public sdClusteredRatio: number
  public meanClusterCount: number
  public sdClusterCount: number

  @Input("data")
  set setData(decodedItemsPerParticipant: Array<{ participant: any, decodedItems: Array<DecodedItem>, weekdayLogs: Array<DecodedItem>, weekendLogs: Array<DecodedItem> }>) {
    this.decodedItemsPerParticipant = decodedItemsPerParticipant
    this.clusterSummary = []

    let clusters = new Array<Cluster>()
    let data = []
    decodedItemsPerParticipant.forEach((participantRow, participantIndex) => {
      const sequence = getExperimentDateSequenceOfParticipant(participantRow.participant, new Date(), true).slice(0, 16).map(d => moment(d))
      data = data.concat(participantRow.decodedItems.map(item => {
        return {
          x: sequence.findIndex(d => d.isSame(moment(item.item.timestamp), 'day') === true) + item.timestampDayRatio,
          y: participantIndex,
          z: item
        }
      }))
      const c = this.findClusters(participantRow, sequence, 300000)
      clusters = clusters.concat(c)
      this.clusterSummary.push({participant: participantRow.participant, itemCount: participantRow.decodedItems.length, clusterCount: c.length, clusteredItemCount: d3.sum(c, c=>c.decodedItems.length)})
    })

    this.clusterSummary.sort((a,b)=>{return b.clusteredItemCount/b.itemCount - a.clusteredItemCount/a.itemCount})
    this.meanClusterCount = d3.mean(this.clusterSummary, p=>p.clusterCount)
    this.sdClusterCount = d3.deviation(this.clusterSummary, p=>p.clusterCount)
    this.meanClusteredRatio = d3.mean(this.clusterSummary, p=>p.clusteredItemCount/p.itemCount)
    this.sdClusteredRatio = d3.deviation(this.clusterSummary, p=>p.clusteredItemCount/p.itemCount)
    
    const clusterData = clusters.map(cluster => {return {y: decodedItemsPerParticipant.findIndex(d=>d.participant._id === cluster.participant._id), x: cluster.startX, x2: cluster.endX}})

    const chartOptions = HighChartsHelper.makeDefaultChartOptions('scatter')

    chartOptions.title = {
      text: "Logging Timestamp Timeline (Relative)",
      style: 'font-size:16px'
    }

    chartOptions.chart.zoomType = "x"

    chartOptions.yAxis = {
      type: 'category',
      title: { text: null },
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
          pointFormatter: function () {
            return moment(this.z.item.timestamp).format('YYYY-MM-DD') + "<br>" + this.z.rationale
          }
        }
      },
      xrange:{
        pointPadding: 0,
        borderRadius: 0,
        borderWidth: 1,
        pointWidth: 10,
        tooltip:{
          pointFormatter: function(){
            return this.z.decodedItems.length + " logs"
          }
        }
      }
    }

    chartOptions.series = [

      {
        name: 'cluster',
        type: 'xrange',
        data: clusters.map(cluster => {return {y: decodedItemsPerParticipant.findIndex(d=>d.participant._id === cluster.participant._id), 
          x: cluster.startX-0.03, 
          x2: cluster.endX+0.03, 
          color: "rgba(0,0,0,0.4)",
          z: cluster
        }})
      },
      {
        name: 'timestamp',
        type: 'scatter',
        color: "rgba(46, 198, 198, 0.2)",
        data: data
      }
    ]

    this.scatterPlot = new Chart(chartOptions)
  }

  constructor() { }

  ngOnInit() {
  }


  findClusters(participantRow: { participant: any, decodedItems: Array<DecodedItem> }, sequence: Array<moment.Moment>, threshold: number): Array<Cluster> {
    const clusters = new Array<Cluster>()
    participantRow.decodedItems.sort((a, b) => a.item.timestamp - b.item.timestamp)
    if (participantRow.decodedItems.length < 2) {
      return clusters
    }

    let currentCluster: Cluster = null
    for (let i = 1; i < participantRow.decodedItems.length; i++) {
      if (Math.abs(participantRow.decodedItems[i - 1].item.timestamp - participantRow.decodedItems[i].item.timestamp) <= threshold) {
        if (currentCluster) {
          currentCluster.decodedItems.push(participantRow.decodedItems[i])
        }
        else {
          currentCluster = { participant: participantRow.participant, decodedItems: new Array<DecodedItem>(), start: 0, end: 0, startX: 0, endX: 0 }
          currentCluster.decodedItems.push(participantRow.decodedItems[i - 1])
          currentCluster.decodedItems.push(participantRow.decodedItems[i])
        }
      } else if (currentCluster) {
        clusters.push(currentCluster)
        currentCluster = null
      }
    }

    if (currentCluster) {
      clusters.push(currentCluster)
    }

    clusters.forEach(cluster => {
      cluster.start = d3.min(cluster.decodedItems, i => i.item.timestamp)
      cluster.end = d3.max(cluster.decodedItems, i => i.item.timestamp)
      cluster.startX = sequence.findIndex(d => d.isSame(moment(cluster.decodedItems[0].item.timestamp), 'day') === true) + cluster.decodedItems[0].timestampDayRatio
      cluster.endX = sequence.findIndex(d => d.isSame(moment(cluster.decodedItems[cluster.decodedItems.length - 1].item.timestamp), 'day') === true) + cluster.decodedItems[cluster.decodedItems.length - 1].timestampDayRatio
    })

    return clusters
  }

}

interface Cluster {
  participant: IParticipantDbEntity,
  decodedItems: Array<DecodedItem>,
  start: number,
  end: number,
  startX: number,
  endX: number
}
