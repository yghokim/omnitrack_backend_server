import { ITrackerDbEntity, IItemDbEntity, IParticipantDbEntity } from "../../../../omnitrack/core/db-entity-types";
import { ServerFile, TimePoint } from "../../../../omnitrack/core/datatypes/field_datatypes";
import * as d3 from 'd3';
import { ScaleLinear } from "d3";
import PropertyHelperManager from "../../../../omnitrack/core/properties/property.helper.manager";
import { EPropertyType } from "../../../../omnitrack/core/properties/property.types";
import ChoiceAttributeHelper from "../../../../omnitrack/core/attributes/choice.attribute.helper";
import TypedStringSerializer from "../../../../omnitrack/core/typed_string_serializer";
import { Moment } from "moment";
import * as moment from 'moment-timezone';


const INJECTION_ID_PIVOT_TYPE = "OZLc8BKS";
const INJECTION_ID_PIVOT_TIME = "UDTGuxJm";
const INJECTION_ID_DURATION = "uyMhOEin";
const INJECTION_ID_PRODUCTIVITY = "QizUYovc";
const INJECTION_ID_TASKS = "3CVBwMM1";
const INJECTION_ID_USED_DEVICES = "KJeafavG";
const INJECTION_ID_LOCATION = "ztoRgnIY";
const INJECTION_ID_RATIONALE = "9hwQHamo";
const INJECTION_ID_MOOD = "BuzCGUEt";
const INJECTION_ID_PHOTO = "YNtFn97k";

const INJECTION_ID_OMIT_DATE = "Ac4gSN0C";
const INJECTION_ID_OMIT_NOTE = "syXB4sIp";

export interface TrackingSet{
  overrideStartDate?: number,
  tracker: ITrackerDbEntity,
  items: Array<IItemDbEntity>,
  omitLogTracker: ITrackerDbEntity,
  omitLogs: Array<IItemDbEntity>
};

export interface TrackingSetOfParticipant extends TrackingSet{
  participant: IParticipantDbEntity,
}

/* This log is not 1:1 matched with the items. 
 * The items can be divided into multiple logs if the range exceeds the day.
*/

export type DecodedItem = {
  user: string;
  productivity: number;
  duration: number;
  from: number;
  to: number;
  timestampDayRatio: number,
  usedDevices: Array<string>;
  tasks: Array<string>;
  location: string;
  rationale: string;
  mood?: number,
  photo?: ServerFile,
  dominantDate: Date;
  dominantDateNumber: number;
  item: IItemDbEntity;
};

export class ProductivityLog {
  dateStart: number;
  fromDateRatio: number;
  toDateRatio: number;
  productivity: number;
  decodedItem: DecodedItem;
  user: string;
}

export class OmitLog {
  dateStart: number;
  note: string;
  timestamp: number;
}

export interface ProductivityTimelineData {
  logs: Array<ProductivityLog>;
}

export class ProductivityHelper {

  static readonly TIME_OF_DAY_TICKS = [0, 3 / 24, 6 / 24, 9 / 24, 12 / 24, 15 / 24, 18 / 24, 21 / 24, 1]
  static readonly TIME_OF_DAY_MINORTICKS = d3.range(0, 1, 1 / 24)

  static readonly productivityColorScale: ScaleLinear<d3.RGBColor, string> = d3
    .scaleLinear<d3.RGBColor, number>()
    .domain([0, 2])
    .interpolate(d3.interpolateHcl)
    .range([d3.rgb("rgb(243, 220, 117)"), d3.rgb("#2387a0")]);

  static getProductivityColor(productivity: number): string {
    return this.productivityColorScale(productivity);
  }

  static getProductivityLabel(productivity: number): string {
    switch (productivity.toString()) {
      case "0":
        return "보통";
      case "1":
        return "생산적";
      case "2":
        return "매우 생산적";
    }
  }

  static formatDurationText(valueInMinutes: number): string {
    const hour = Math.floor(valueInMinutes);
    if (valueInMinutes - hour < 0.0001) {
      return hour + "시간";
    } else {
      const minute = ((valueInMinutes - hour) * 60).toFixed(0);
      return hour + "시간" + " " + minute + "분";
    }
  }

  static extractDurationBinsAndHistogram(decodedItems: Array<DecodedItem>): { ranges: Array<{ from: number, to: number }>, hist: any } {
    const durationRange = d3.extent<number>(decodedItems.map(d => d.duration))

    const maxTickCount = 10
    var currentTickUnit = 0.5
    while ((durationRange[1] / 60) / currentTickUnit > maxTickCount - 1) {
      currentTickUnit *= 2
    }
    var numTicks = 1
    while (durationRange[1] / 60 >= numTicks * currentTickUnit) {
      numTicks++
    }

    const binBounds = d3.range(0, 60 * (numTicks + 1) * currentTickUnit, currentTickUnit * 60)

    const durationRanges = Array<{ from: number, to: number }>()
    for (let i = 0; i < binBounds.length - 1; i++) {
      durationRanges.push({ from: binBounds[i], to: binBounds[i + 1] })
    }

    const hist = d3.histogram<DecodedItem, number>().value((d, i, data) => d.duration).thresholds(binBounds)
    return { ranges: durationRanges, hist: hist }
  }

  static isProductivityTracker(tracker: ITrackerDbEntity): boolean{
    if(tracker.flags){
      return tracker.flags.injectionId === "Ab0ksQyh"
    }
    else return false
  }

  static isOmitLogTracker(tracker: ITrackerDbEntity): boolean{
    if(tracker.flags){
      return tracker.flags.injectionId === "gGv9WCm3"
    }
    else return false
  }

  static timeRangeToText(range: { from: number, to: number }): string {
    if (range.from <= 0) {
      return "<" + (range.to / 60).toFixed(1) + "시간"
    } else {
      return (range.from / 60).toFixed(1) + " ~ " + (range.to / 60).toFixed(1) + "시간"
    }
  }

  static getChoiceEntryListByAttrInjectionId(
    tracker: ITrackerDbEntity,
    injectionId: string
  ): any {
    return PropertyHelperManager.getHelper(
      EPropertyType.ChoiceEntryList
    ).deserializePropertyValue(
      tracker.attributes
        .find(attr => attr.flags.injectionId === injectionId)
        .properties.find(
          prop => prop.key == ChoiceAttributeHelper.PROPERTY_ENTRIES
        ).sVal
    );
  }

  static getAttributeValueByInjectionId(
    tracker: ITrackerDbEntity,
    item: IItemDbEntity,
    injectionId: string
  ): any {
    const attr = tracker.attributes.find(
      attr => attr.flags.injectionId === injectionId
    );
    if (attr) {
      const entry = item.dataTable.find(
        entry => entry.attrLocalId === attr.localId
      );
      if (entry) {
        return TypedStringSerializer.deserialize(entry.sVal);
      } else return null;
    } else return null;
  }

  static processTrackingSet(trackingSet: TrackingSet): {productivityLogs: Array<ProductivityLog>, decodedItems: Array<DecodedItem>, omitLogs: Array<OmitLog>}{
      const taskEntries = ProductivityHelper.getChoiceEntryListByAttrInjectionId(
        trackingSet.tracker,
        INJECTION_ID_TASKS
      );
      const locationEntries = ProductivityHelper.getChoiceEntryListByAttrInjectionId(
        trackingSet.tracker,
        INJECTION_ID_LOCATION
      );
      const deviceEntries = ProductivityHelper.getChoiceEntryListByAttrInjectionId(
        trackingSet.tracker,
        INJECTION_ID_USED_DEVICES
      );

      const decodedItems: Array<DecodedItem> = [];
      const logs: Array<ProductivityLog> = [];
      trackingSet.items.forEach(item => {
        const _pivotType: Array<number> = ProductivityHelper.getAttributeValueByInjectionId(
          trackingSet.tracker,
          item,
          INJECTION_ID_PIVOT_TYPE
        );
        const pivotType: number =
          _pivotType && _pivotType.length > 0 ? _pivotType[0] : null;

        const pivotTime: TimePoint = ProductivityHelper.getAttributeValueByInjectionId(
          trackingSet.tracker,
          item,
          INJECTION_ID_PIVOT_TIME
        );

        const _duration = ProductivityHelper.getAttributeValueByInjectionId(
          trackingSet.tracker,
          item,
          INJECTION_ID_DURATION
        );

        const duration: number = _duration
          ? Number(_duration.toString())
          : null;

        const _productivity: Array<
          number
          > = ProductivityHelper.getAttributeValueByInjectionId(
            trackingSet.tracker,
            item,
            INJECTION_ID_PRODUCTIVITY
          );

        const productivity =
          _productivity && _productivity.length > 0 ? _productivity[0] : null;

        const rationale = ProductivityHelper.getAttributeValueByInjectionId(
          trackingSet.tracker,
          item,
          INJECTION_ID_RATIONALE
        );

        const photo = ProductivityHelper.getAttributeValueByInjectionId(trackingSet.tracker, item, INJECTION_ID_PHOTO)

        const mood = ProductivityHelper.getAttributeValueByInjectionId(trackingSet.tracker, item, INJECTION_ID_MOOD)

        if (
          pivotType != null &&
          pivotTime != null &&
          duration != null &&
          productivity != null
        ) {
          const _taskIds = ProductivityHelper.getAttributeValueByInjectionId(
            trackingSet.tracker,
            item,
            INJECTION_ID_TASKS
          );
          const _locationIds = ProductivityHelper.getAttributeValueByInjectionId(
            trackingSet.tracker,
            item,
            INJECTION_ID_LOCATION
          );
          const _deviceIds = ProductivityHelper.getAttributeValueByInjectionId(
            trackingSet.tracker,
            item,
            INJECTION_ID_USED_DEVICES
          );

          const pivotMoment = pivotTime.toMoment();
          var startMoment: Moment;
          var endMoment: Moment;

          if (pivotType === 0) {
            //pivot is start
            startMoment = pivotMoment.clone();
            endMoment = pivotMoment.clone();
            endMoment.add(duration, "minutes");
          } else {
            //pivot is end
            endMoment = pivotMoment.clone();
            startMoment = pivotMoment.clone();
            startMoment.subtract(duration, "minutes");
          }

          //divide into logs if exceeds.

          const startDayStart = startMoment.clone().startOf("day");
          const startRatio = startMoment.diff(startDayStart, "day", true);
          const endDiffRatio = endMoment.diff(startDayStart, "day", true);
          const numDaysBetween = Math.floor(endDiffRatio);

          //Make daily entry logs
          const dominantDate =
            (startRatio + endDiffRatio) * 0.5 <= 1
              ? startDayStart.toDate()
              : endMoment
                .clone()
                .startOf("day")
                .toDate();

          const decoded = {
            user: item.user,
            productivity: productivity,
            duration: duration,
            from: startMoment.valueOf(),
            to: endMoment.valueOf(),
            dominantDate: dominantDate,
            timestampDayRatio: moment(item.timestamp).diff(moment(item.timestamp).startOf('day'), 'day', true),
            dominantDateNumber: dominantDate.getTime(),
            usedDevices: _deviceIds
              ? _deviceIds.map(
                id => {
                  const match = deviceEntries.entries.find(d => d.id === id)
                  if (match) return match.val
                  else return "선택지 삭제됨"
                }
              )
              : [],
            location:
              _locationIds && _locationIds.length > 0
                ? locationEntries.entries.find(l => l.id === _locationIds[0])
                  .val
                : null,
            tasks: _taskIds
              ? _taskIds.map(
                id => {
                  const match = taskEntries.entries.find(d => d.id === id)
                  if (match) return match.val
                  else return "선택지 삭제됨"
                }
              )
              : [],
            rationale: rationale,
            mood: mood ? (mood.upper / mood.under) : null,
            photo: photo,
            item: item
          };

          decodedItems.push(decoded);

          //Make timeline logs
          logs.push({
            dateStart: startDayStart.toDate().getTime(),
            fromDateRatio: startRatio,
            toDateRatio: Math.min(endDiffRatio, 1),
            productivity: productivity,
            decodedItem: decoded,
            user: item.user
          });

          for (var i = 0; i < numDaysBetween; i++) {
            const toDateRatio =  Math.min(endDiffRatio - (1 + i), 1)
            if(toDateRatio < 1/(24*60)){
              // Skip less than 1 minute
              continue;
            }

            logs.push({
              dateStart: startDayStart
                .clone()
                .add(1 + i, "day")
                .toDate()
                .getTime(),
              fromDateRatio: 0,
              toDateRatio: toDateRatio,
              productivity: productivity,
              decodedItem: decoded,
              user: item.user
            });
          }
        } else {
        }
      });

      let omitLogs
      if (trackingSet.omitLogTracker) {
        omitLogs = trackingSet.omitLogs.map(logItem => {
          const date: TimePoint = ProductivityHelper.getAttributeValueByInjectionId(
            trackingSet.omitLogTracker,
            logItem,
            INJECTION_ID_OMIT_DATE
          );

          const note: string = ProductivityHelper.getAttributeValueByInjectionId(
            trackingSet.omitLogTracker,
            logItem,
            INJECTION_ID_OMIT_NOTE
          );
          return {dateStart: date.toMoment().startOf('day').toDate().getTime(), note: note, timestamp: logItem.timestamp}
        })
      }

      return {productivityLogs: logs, decodedItems: decodedItems, omitLogs: omitLogs}
  }
}