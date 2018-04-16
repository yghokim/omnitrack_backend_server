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

  readonly sectionsOfDay: Array<{ name: string, ranges: Array<{ from: number, to: number }> }> = [
    {
      name: "Daytime",
      ranges: [
        {
          from: (6 / 24), // am 6:00
          to: 19 / 24 // pm 7:00
        }
      ]
    },
    {
      name: "Night",
      ranges: [{
        from: 0,
        to: 6 / 24
      }, {
        from: 19 / 24,
        to: 1
      }]
    }
  ]

  static readonly productivityFormatter = (productivity: any) => {
    if (productivity) {
      return (Math.round(productivity * 200) / 100).toFixed(2)
    } else { return "" }
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

    const columnsPerSection: Array<SummaryTableColumn> = this.sectionsOfDay.map(s => ({
      columnName: s.name + " Productivity", rows: [], order: 3,
      valueFormatter: ProductivityAnalysisComponent.productivityFormatter
    }))

    const stackColumnsPerSection: Array<SummaryTableColumn> = this.sectionsOfDay.map(s => ({
      columnName: s.name + " Ratio", rows: [], order: 3,
    }))

    data.participants.forEach(participant => {
      const logs: Array<ProductivityLog> = groupedByUser[participant.user._id]
      if (logs) {
        const weekdayLogs = logs.filter(log => moment(log.dateStart).isoWeekday() < 6)
        const weekendLogs = logs.filter(log => moment(log.dateStart).isoWeekday() >= 6)

        const overall = this.calcWeightedMeanProductivity(logs)

        totalProductivityColumn.rows.push({ participant: participant, value: overall.productivity, type: 'productivity' })

        if (weekdayLogs.length > 0) {
          const weekday = this.calcWeightedMeanProductivity(weekdayLogs)

          weekdayProductivityColumn.rows.push({ participant: participant, value: weekday.productivity, type: 'productivity' })

          this.sectionsOfDay.forEach(
            (section, i) => {
              const sectionLogs: Array<{ productivity: number, fromDateRatio: number, toDateRatio: number }> = []
              const stackLogs: Array<[number, number, number]> = []
              for (const log of weekdayLogs) {
                for (const range of section.ranges) {
                  if (range.from < log.toDateRatio && range.to > log.fromDateRatio) {
                    sectionLogs.push({ productivity: log.productivity, fromDateRatio: Math.max(range.from, log.fromDateRatio), toDateRatio: Math.min(range.to, log.toDateRatio) })
                  }
                }
              }
              const stat = this.calcWeightedMeanProductivity(sectionLogs)
              columnsPerSection[i].rows.push({ participant: participant, value: stat.productivity, type: 'productivity' })
              stackColumnsPerSection[i].rows.push({ participant: participant,
                value: this.normalize([0, 1, 2].map(prod => d3.sum(sectionLogs.filter(l => (l.productivity % 3) === prod), l => (l.toDateRatio - l.fromDateRatio)))),
                type: 'productivity-ratio'
              })
            }
          )

        } else {
          weekdayProductivityColumn.rows.push({ participant: participant, value: null })
        }

        if (weekendLogs.length > 0) {
          const weekend = this.calcWeightedMeanProductivity(weekendLogs)

          weekendProductivityColumn.rows.push({ participant: participant, value: weekend.productivity, type: 'productivity' })
        } else {
          weekendProductivityColumn.rows.push({ participant: participant, value: null })
        }

      } else {
        totalProductivityColumn.rows.push({ participant: participant, value: null })
      }
    })

    totalProductivityColumn.summary = this.productivitySummary.makeStatisticsSummaryHtmlContent(totalProductivityColumn.rows, (r) => r.value * 2, (n) => n.toFixed(2))
    weekdayProductivityColumn.summary = this.productivitySummary.makeStatisticsSummaryHtmlContent(weekdayProductivityColumn.rows, (r) => r.value * 2, (n) => n.toFixed(2))
    weekendProductivityColumn.summary = this.productivitySummary.makeStatisticsSummaryHtmlContent(weekendProductivityColumn.rows, (r) => r.value * 2, (n) => n.toFixed(2))

    this.productivitySummary.upsertColumn(totalProductivityColumn)
    this.productivitySummary.upsertColumn(weekdayProductivityColumn)
    this.productivitySummary.upsertColumn(weekendProductivityColumn)

    columnsPerSection.forEach((c, i) => {
      c.summary = this.productivitySummary.makeStatisticsSummaryHtmlContent(c.rows, (r) => r.value * 2, (n) => n.toFixed(2))
      this.productivitySummary.upsertColumn(c)
    })

    stackColumnsPerSection.forEach((c, i) => {
      this.productivitySummary.upsertColumn(c)
    })

  }


  constructor(private productivitySummary: ProductivitySummaryService) { }

  ngOnInit() {
  }

  private calcWeightedMeanProductivity(logs: Array<{ productivity: number, fromDateRatio: number, toDateRatio: number }>): { totalDuration: number, productivity: number } {
    const durationSum = d3.sum(logs, l => (l.fromDateRatio - l.toDateRatio) * 24 * 60)
    const productivitySum = d3.sum(logs, l => (l.fromDateRatio - l.toDateRatio) * 24 * 60 * (l.productivity % 3))

    return { totalDuration: durationSum, productivity: (productivitySum / durationSum) / 2 }
  }

  private normalize(arr: Array<number>): Array<number> {
    const sum = d3.sum(arr)
    return arr.map(elm => elm / sum)
  }
}
