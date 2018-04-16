import { Component, OnInit, Input } from '@angular/core';
import { ProductivityLog } from '../../../../shared-visualization/custom/productivity-helper';
import { IParticipantDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import { groupArrayByVariable } from '../../../../../../shared_lib/utils';
import * as d3 from 'd3';
import * as moment from 'moment';
import { SummaryTableColumn, ProductivitySummaryService } from '../productivity-summary.service';

@Component({
  selector: 'app-productivity-analysis',
  templateUrl: './productivity-analysis.component.html',
  styleUrls: ['./productivity-analysis.component.scss']
})
export class ProductivityAnalysisComponent implements OnInit {

  static readonly productivityFormatter = (productivity: any) => {
    if (productivity) {
      return (Math.round(productivity * 200) / 100).toFixed(2)
    } else return ""
  }

  @Input("data")
  set setDate(data: { participants: Array<IParticipantDbEntity>, productivityLogs: Array<ProductivityLog> }) {
    const groupedByUser = groupArrayByVariable(data.productivityLogs, "user")

    const totalProductivityColumn: SummaryTableColumn = {
      columnName: "Total Productivity",
      rows: [],
      valueFormatter: ProductivityAnalysisComponent.productivityFormatter,
      order: 3
    }

    const weekdayProductivityColumn: SummaryTableColumn = {
      columnName: "Weekday Productivity",
      rows: [],
      valueFormatter: ProductivityAnalysisComponent.productivityFormatter,
      order: 3
    }

    const weekendProductivityColumn: SummaryTableColumn = {
      columnName: "Weekend Productivity",
      rows: [],
      valueFormatter: ProductivityAnalysisComponent.productivityFormatter,
      order: 3
    }

    const totalDurationColumn: SummaryTableColumn = {
      columnName: "Total Logged Duration",
      rows: [],
      order: 3
    }

    data.participants.forEach(participant => {
      const logs: Array<ProductivityLog> = groupedByUser[participant.user._id]
      if (logs) {
        const weekdayLogs = logs.filter(log => moment(log.dateStart).isoWeekday() < 6)
        const weekendLogs = logs.filter(log => moment(log.dateStart).isoWeekday() >= 6)

        const overall = this.calcWeightedMeanProductivity(logs)

        totalProductivityColumn.rows.push({ participant: participant, value: overall.productivity, type: 'ratio' })

        if (weekdayLogs.length > 0) {
          const weekday = this.calcWeightedMeanProductivity(weekdayLogs)

          weekdayProductivityColumn.rows.push({ participant: participant, value: weekday.productivity, type: 'ratio' })
        }
        else {
          weekdayProductivityColumn.rows.push({ participant: participant, value: null })
        }

        if (weekendLogs.length > 0) {
          const weekend = this.calcWeightedMeanProductivity(weekendLogs)

          weekendProductivityColumn.rows.push({ participant: participant, value: weekend.productivity, type: 'ratio' })
        }
        else {
          weekendProductivityColumn.rows.push({ participant: participant, value: null })
        }
      }
      else {
        totalProductivityColumn.rows.push({ participant: participant, value: null })
      }
    })

    this.productivitySummary.upsertColumn(totalProductivityColumn)
    this.productivitySummary.upsertColumn(weekdayProductivityColumn)
    this.productivitySummary.upsertColumn(weekendProductivityColumn)
  }

  constructor(private productivitySummary: ProductivitySummaryService) { }

  ngOnInit() {
  }

  private calcWeightedMeanProductivity(logs: Array<ProductivityLog>): { totalDuration: number, productivity: number } {
    const durationSum = d3.sum(logs, l => (l.fromDateRatio - l.toDateRatio) * 24 * 60)
    const productivitySum = d3.sum(logs, l => (l.fromDateRatio - l.toDateRatio) * 24 * 60 * (l.productivity % 3))

    return { totalDuration: durationSum, productivity: (productivitySum / durationSum) / 2 }
  }
}
