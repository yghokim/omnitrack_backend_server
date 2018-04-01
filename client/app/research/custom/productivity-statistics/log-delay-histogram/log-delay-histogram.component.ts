import { Component, OnInit, Input } from '@angular/core';
import { DecodedItem } from '../../../../shared-visualization/custom/productivity-helper';
import { HighChartsHelper } from '../../../../shared-visualization/highcharts-helper';
import { Chart } from 'angular-highcharts';
import * as d3 from 'd3';
import * as moment from 'moment';
import { IParticipantDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import { groupArrayByVariable } from '../../../../../../shared_lib/utils';
import { getExperimentDateSequenceOfParticipant } from '../../../../../../omnitrack/experiment-utils';

@Component({
  selector: 'app-log-delay-histogram',
  templateUrl: './log-delay-histogram.component.html',
  styleUrls: ['./log-delay-histogram.component.scss']
})
export class LogDelayHistogramComponent implements OnInit {

  public chart

  private delayMinutes = 10
  private delayBinMax = 60 * 24

  public participants: Array<IParticipantDbEntity>
  public decodedItems: Array<DecodedItem>

  public globalChart: Chart

  @Input("participants") set _participants(participants: Array<IParticipantDbEntity>) {
    this.participants = participants
    if (this.decodedItems) {
      this.refresh(this.participants, this.decodedItems)
    }
  }

  @Input("decodedItems") set _decodedItems(decodedItems: Array<DecodedItem>) {
    this.decodedItems = decodedItems
    if (this.participants) {
      this.refresh(this.participants, this.decodedItems)
    }

    /*
        const chartOptions = HighChartsHelper.makeDefaultChartOptions('histogram')
        chartOptions.series = delaySeconds
    
        this.chart = new Chart(chartOptions)*/
  }

  constructor() { }

  ngOnInit() {
  }

  private refresh(participants: Array<IParticipantDbEntity>, decodedItems: Array<DecodedItem>) {

    console.log("refresh")

    const today = moment().endOf('day').toDate()

    let totalDelayLogs: Array<DelayLog> = []
    const delayLogsPerParticipant: Array<{ participant: IParticipantDbEntity, delayLogs: Array<DelayLog>, dailyAggregated: Array<DelayInfoPerDay> }> = []

    const grouped = groupArrayByVariable(decodedItems, "user")
    for (let userId of Object.keys(grouped)) {
      const decodedItemsOfParticipant: Array<DecodedItem> = grouped[userId]
      const participant = participants.find(p => p.user._id === userId)
      if (participant) {
        const daySequence = getExperimentDateSequenceOfParticipant(participant, today, false)
        const delayLogs = decodedItemsOfParticipant.map(decodedItem => {
          let delay
          if (decodedItem.item.timestamp > decodedItem.from && decodedItem.item.timestamp < decodedItem.to) {
            //inside
            delay = 0
          } else if (decodedItem.item.timestamp >= decodedItem.to) {
            //delayed
            delay = decodedItem.item.timestamp - decodedItem.to
          }
          else {
            //before
            delay = decodedItem.item.timestamp - decodedItem.from
          }
          delay = Math.round(delay / 60000)
          return {x: daySequence.findIndex(d=> moment(d).isSame(decodedItem.dominantDate, 'day') === true), y: delay}
        })
        delayLogsPerParticipant.push({participant: participant, delayLogs: delayLogs, dailyAggregated: this.calcDelayData(delayLogs)})
        totalDelayLogs = totalDelayLogs.concat(delayLogs)
      }
    }

    const globalData = this.calcDelayData(delayLogsPerParticipant.reduce((a, b)=>a.concat(b.dailyAggregated), []))
    console.log(globalData)
  }
  
  private calcDelayData(logs: Array<DelayLog | DelayInfoPerDay>): Array<DelayInfoPerDay>{
    let result: Array<DelayInfoPerDay> = []
    const grouped = groupArrayByVariable(logs, "x")
    for(let dayIndexString of Object.keys(grouped)){
      const data: Array<DelayLog | DelayInfoPerDay> = grouped[dayIndexString]
      result.push({
        x: Number.parseInt(dayIndexString),
        y: "data" in data[0]? d3.mean(data, (d)=>d.y) : d3.median(data, (d)=>d.y),
        se: d3.deviation(data, (d)=>d.y)/Math.sqrt(data.length),
        data: data
      })
    }
    return result
  }

}

interface DelayLog {
  x: number, // dayindex
  y: number // delayMinutes
}

interface DelayInfoPerDay{
  x: number, // dayIndex
  y: number,
  se: number,
  data: Array<DelayLog | DelayInfoPerDay>
}