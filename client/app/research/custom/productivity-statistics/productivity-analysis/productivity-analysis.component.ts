import { Component, OnInit, Input } from '@angular/core';
import { ProductivityLog, DecodedItem } from '../../../../shared-visualization/custom/productivity-helper';
import { IParticipantDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import { groupArrayByVariable } from '../../../../../../shared_lib/utils';
import * as d3 from 'd3';
import * as moment from 'moment';
import { SummaryTableColumn, ProductivitySummaryService } from '../productivity-summary.service';
import { pairedTTest, TestResult, getStatisticsString } from '../../../../../../shared_lib/statistics';

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

  public moodComparisonTestResults: Array<{ aName: string, bName: string, result: string }>

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

    const moodColumnsPerSection: Array<SummaryTableColumn> =
      this.sectionsOfDay.map(s => ({
        columnName: s.name + " Mood", rows: [], order: 3,
      }))

    const moodCoverageColumnsPerSection: Array<SummaryTableColumn> =
      this.sectionsOfDay.map(s => ({
        columnName: s.name + " Mood Coverage", rows: [], order: 3,
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
              const sectionLogs: Array<{ productivity: number, fromDateRatio: number, toDateRatio: number, item: DecodedItem }> = []
              const stackLogs: Array<[number, number, number]> = []
              for (const log of weekdayLogs) {
                for (const range of section.ranges) {
                  if (range.from < log.toDateRatio && range.to > log.fromDateRatio) {
                    sectionLogs.push({ productivity: log.productivity, fromDateRatio: Math.max(range.from, log.fromDateRatio), toDateRatio: Math.min(range.to, log.toDateRatio), item: log.decodedItem })
                  }
                }
              }
              const stat = this.calcWeightedMeanProductivity(sectionLogs)
              columnsPerSection[i].rows.push({ participant: participant, value: stat.productivity, type: 'productivity' })
              stackColumnsPerSection[i].rows.push({
                participant: participant,
                value: this.normalize([0, 1, 2].map(prod => d3.sum(sectionLogs.filter(l => (l.productivity % 3) === prod), l => (l.toDateRatio - l.fromDateRatio)))),
                type: 'productivity-ratio'
              })

              const moodSummary = this.calcMoodSummary(sectionLogs)

              moodColumnsPerSection[i].rows.push({ participant: participant, value: moodSummary.mean, type: 'mood' })

              moodCoverageColumnsPerSection[i].rows.push({
                participant: participant,
                value: moodSummary.coverage,
                type: 'ratio'
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

    moodColumnsPerSection.forEach(c => {
      this.productivitySummary.upsertColumn(c)
    })

    moodCoverageColumnsPerSection.forEach(c => {
      this.productivitySummary.upsertColumn(c)
    })

    const moodTestResult = this.comparisonTest(moodColumnsPerSection[0], moodColumnsPerSection[1])
    if (moodTestResult) {
      this.moodComparisonTestResults = [
        {
          aName: moodColumnsPerSection[0].columnName,
          bName: moodColumnsPerSection[1].columnName,
          result: getStatisticsString(moodTestResult)
        }
      ]
    }

    const productivityTestResult = this.comparisonTest(columnsPerSection[0], columnsPerSection[1])
    if (productivityTestResult) {
      console.log(productivityTestResult)
    }

  }


  constructor(private productivitySummary: ProductivitySummaryService) { }

  ngOnInit() {
  }

  private calcMoodSummary(logs: Array<{ item: DecodedItem, fromDateRatio: number, toDateRatio: number }>): { mean: number, coverage: number } {

    if (logs && logs.length > 0) {
      const covered = logs.filter(l => l.item.mood)

      if (covered.length > 0) {
        const coveredTotalDuration = d3.sum(covered, l => (l.fromDateRatio - l.toDateRatio) * 24 * 60)
        const totalDuration = d3.sum(logs, l => (l.fromDateRatio - l.toDateRatio) * 24 * 60)
        const weightedSum = d3.sum(covered, l => (l.fromDateRatio - l.toDateRatio) * 24 * 60 * l.item.mood)
        return {
          mean: weightedSum / coveredTotalDuration,
          coverage: coveredTotalDuration / totalDuration
        }
      } else {
        return {
          mean: null,
          coverage: 0
        }
      }
    } else {
      return {
        mean: null,
        coverage: null
      }
    }
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

  private comparisonTest(moodColumnA: SummaryTableColumn, moodColumnB: SummaryTableColumn): TestResult {
    const sampleA: Array<number> = []
    const sampleB: Array<number> = []
    for (let i = 0; i < moodColumnA.rows.length; i++) {
      if (moodColumnA.rows[i].value && moodColumnB.rows[i].value) {
        sampleA.push((moodColumnA.rows[i].value))
        sampleB.push((moodColumnB.rows[i].value))
      }
    }

    console.log("sampleA")
    console.log(sampleA.join(","))
    console.log("sampleB")
    console.log(sampleB.join(","))
    return pairedTTest(sampleA, sampleB)
  }
}
