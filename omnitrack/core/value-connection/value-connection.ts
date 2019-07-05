import { IFactoryMeasure } from "./measure-factory";

export enum ETimeQueryPivot {
  TYPE_PIVOT_TIMESTAMP = 0,
  TYPE_PIVOT_KEY_TIME,
  TYPE_LINK_TIMESPAN,
  TYPE_PIVOT_TIMEPOINT
}

export enum ETimeQueryBinSize {
  BIN_SIZE_HOUR = 0,
  BIN_SIZE_DAY,
  BIN_SIZE_WEEK
}

export enum ETimeQueryGranularity{
  Millis, Second, Minute, Hour, Day, Week
}

export class OTTimeQuery {

  static fromJson(json: any): OTTimeQuery{
    const obj = new OTTimeQuery()
    obj.anchored = json.anchored
    obj.binOffset = json.binOffset
    obj.binSize = json.binSize
    obj.linkedFieldId = json.linkedFieldId
    obj.mode = json.mode

    return obj
  }

  static createDefault(): OTTimeQuery{
    return new OTTimeQuery()
  }

  static isBinAndOffsetAvailable(query: OTTimeQuery): boolean {
    return query.mode == ETimeQueryPivot.TYPE_PIVOT_TIMEPOINT || query.mode == ETimeQueryPivot.TYPE_PIVOT_TIMESTAMP || query.mode == ETimeQueryPivot.TYPE_PIVOT_KEY_TIME
  }

  static needsLinkedAttribute(query: OTTimeQuery): boolean {
    return query.mode == ETimeQueryPivot.TYPE_PIVOT_TIMEPOINT || query.mode == ETimeQueryPivot.TYPE_LINK_TIMESPAN
  }

  mode: ETimeQueryPivot = ETimeQueryPivot.TYPE_PIVOT_TIMESTAMP

  anchored: boolean = false

  /*** not used in LINK_TIMESPAN mode.
   *
   */
  binSize: ETimeQueryBinSize = ETimeQueryBinSize.BIN_SIZE_DAY

  /*** not used in LINK_TIMESPAN mode.
   *
   */
  binOffset: number = 0

  linkedFieldId: string = null
}

export class OTConnection{
  measure: IFactoryMeasure
  query: OTTimeQuery
}

export interface TimeQueryPreset{
  name: string,
  description: string,
  granularity: ETimeQueryGranularity,
  query: OTTimeQuery
}
export const TIMEQUERY_PRESETS:Array<TimeQueryPreset> = [
  {
    name: "Present Date",
    description: 'Query from midnight to present',
    granularity: ETimeQueryGranularity.Day,
    query: {
      mode: ETimeQueryPivot.TYPE_PIVOT_TIMESTAMP,
      binOffset: 0,
      binSize: ETimeQueryBinSize.BIN_SIZE_DAY,
      anchored: false,
      linkedFieldId: null
    }
  },
  {
    name: "Previous Date",
    description: 'Query for previous date',
    granularity: ETimeQueryGranularity.Day,
    query: {
      mode: ETimeQueryPivot.TYPE_PIVOT_TIMESTAMP,
      binOffset: -1,
      binSize: ETimeQueryBinSize.BIN_SIZE_DAY,
      anchored: false,
      linkedFieldId: null
    }
  },
  {
    name: "Recent 1 hour",
    description: 'Query from an hour ago to present',
    granularity: ETimeQueryGranularity.Hour,
    query: {
      mode: ETimeQueryPivot.TYPE_PIVOT_TIMESTAMP,
      binOffset: 0,
      binSize: ETimeQueryBinSize.BIN_SIZE_HOUR,
      anchored: true,
      linkedFieldId: null
    }
  },
  {
    name: "Recent 24 hours",
    description: 'Query from 24 hours ago to present',
    granularity: ETimeQueryGranularity.Hour,
    query: {
      mode: ETimeQueryPivot.TYPE_PIVOT_TIMESTAMP,
      binOffset: 0,
      binSize: ETimeQueryBinSize.BIN_SIZE_DAY,
      anchored: true,
      linkedFieldId: null
    }
  },
  {
    name: "Recent 7 days",
    description: 'Query from 7 days ago to present',
    granularity: ETimeQueryGranularity.Hour,
    query: {
      mode: ETimeQueryPivot.TYPE_PIVOT_TIMESTAMP,
      binOffset: 0,
      binSize: ETimeQueryBinSize.BIN_SIZE_WEEK,
      anchored: true,
      linkedFieldId: null
    }
  },
]