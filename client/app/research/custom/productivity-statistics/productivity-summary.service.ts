import { Injectable } from '@angular/core';
import { IParticipantDbEntity } from '../../../../../omnitrack/core/db-entity-types';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as d3 from 'd3';
var snakeCase = require('snake-case');

@Injectable()
export class ProductivitySummaryService {

  private participants: Array<IParticipantDbEntity> = []
  private columns = new Array<SummaryTableColumn>()

  public readonly tableSubject = new BehaviorSubject<{
    header: Array<string>,
    body: Array<Array<{ value: any, type?: string, normalizedRange?: [number, number] }>>,
    footer: Array<string>,
  }>({ header: [], body: [], footer: [] })

  constructor() { }

  setParticipants(participants: Array<IParticipantDbEntity>) {
    this.participants = participants
    console.log("participants set")
    this.updateCache()
  }

  sortBy(columnName: string, asc: boolean = true) {
    const column = this.columns.find(c => c.columnName === columnName)
    if (column) {
      column.rows.sort((a, b) => {
        return (a.value - b.value) * (asc === true ? 1 : -1)
      })
      this.setParticipants(column.rows.map(r => r.participant).filter(p => this.participants.indexOf(p) !== -1))
    }
  }

  upsertColumn(column: SummaryTableColumn) {
    const columnIndex = this.columns.findIndex(c => column.columnName === c.columnName)

    if (columnIndex !== -1) {
      this.columns[columnIndex] = column
    } else {
      this.columns.push(column)
    }

    this.columns.sort((a, b) => {
      return (b.order || Number.MAX_SAFE_INTEGER) - (a.order || Number.MAX_SAFE_INTEGER)
    })

    this.updateCache()
  }

  private updateCache() {
    const header = ["Alias"].concat(this.columns.map(c => c.columnName || ""))
    const body: Array<Array<{ value: any, type?: string }>> = this.participants.map(p =>
      [{ value: "<b>" + p.alias + "</b>" }].concat(this.columns.map(column => {
        const row = column.rows.find(r => r.participant._id === p._id)
        if (row) {
          return { value: row.value, type: row.type, valueFormatter: column.valueFormatter, normalizedRange: column.normalizedRange }
        } else { return { value: "" } }
      })))

    const footer = [""].concat(this.columns.map(column => column.summary))

    this.tableSubject.next({ header: header, body: body, footer: footer })
  }

  public exportToJsonTable(): Array<any> {
    return this.participants.map(p => {
      const row = {
        participant: p.alias
      }
      this.columns.forEach(column => {
        const cell = column.rows.find(r => r.participant._id === p._id) || { value: null }

        if (column.valueExporter) {
          const exported = column.valueExporter(cell.value)
          if (exported instanceof Array) {
            exported.forEach(e => {
              row[snakeCase(e.columnName)] = e.cellValue
            })
          } else {
            row[snakeCase(exported.columnName)] = exported.cellValue
          }
        } else {
          row[snakeCase(column.columnName)] = cell.value
        }
      })
      return row
    })
  }

  public makeStatisticsSummaryHtmlContent(array: Array<any>, accessor: (any) => number, aggrFormatter: (number) => string = null, rawValueFormatter: (number) => string = null, includeRange: boolean = false): string {
    if (array && array.length > 0) {

      const arr = array.filter(elm => accessor(elm) !== null || accessor(elm).toString() !== "")

      const mean = d3.mean(arr, accessor)
      const sd = d3.deviation(arr, accessor)
      let html: string = "<i>M</i> = " + (aggrFormatter ? aggrFormatter(mean) : mean.toString())
      html += " (<i>SD</i> = " + (aggrFormatter ? aggrFormatter(sd) : sd) + ')'
      if (includeRange === true) {
        const min = d3.min(arr, accessor)
        const max = d3.max(arr, accessor)
        html += "<br>Range: " + (rawValueFormatter ? rawValueFormatter(min) : min.toString()) + " ~ " + (rawValueFormatter ? rawValueFormatter(max) : max.toString())
      }
      return html
    } else { return null }
  }
}

export interface SummaryTableCell {
  participant: IParticipantDbEntity,
  value: any,
  type?: string
}

export interface SummaryTableColumn {
  columnName: string,
  order?: number,
  rows: Array<SummaryTableCell>,
  valueFormatter?: (any) => string,
  normalizedRange?: [number, number],
  valueExporter?: (SummaryTableCell) => { columnName: string, cellValue: any } | Array<{ columnName: string, cellValue: any }>,
  summary?: string
}
