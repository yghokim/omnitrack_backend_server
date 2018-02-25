import { Component, OnInit, Input } from '@angular/core';
import { IItemDbEntity, ITrackerDbEntity } from '../../../../../omnitrack/core/db-entity-types';
import TypedStringSerializer from '../../../../../omnitrack/core/typed_string_serializer';
import d3 = require('d3');
import { TimePoint } from '../../../../../omnitrack/core/datatypes/field_datatypes';
import { Moment } from 'moment';
import { ScaleLinear } from 'd3';

@Component({
  selector: 'app-productivity-dashboard',
  templateUrl: './productivity-dashboard.component.html',
  styleUrls: ['./productivity-dashboard.component.scss']
})
export class ProductivityDashboardComponent implements OnInit {
  private readonly INJECTION_ID_PIVOT_TYPE = "OZLc8BKS";
  private readonly INJECTION_ID_PIVOT_TIME = "UDTGuxJm";
  private readonly INJECTION_ID_DURATION = "uyMhOEin";
  private readonly INJECTION_ID_PRODUCTIVITY = "QizUYovc";

  private trackingSet: TrackingSet;
  logs: Array<ProductivityLog> = [];

  productivityColorScale: ScaleLinear<d3.RGBColor, string>

  @Input("trackingSet")
  set _trackingSet(trackingSet: TrackingSet) {
    this.trackingSet = trackingSet;

    if (trackingSet) {
      const logs: Array<ProductivityLog> = []
      trackingSet.items.forEach(item => {
        const pivotType : number = this.getAttributeValueByInjectionId(trackingSet.tracker, item, this.INJECTION_ID_PIVOT_TYPE);
        const pivotTime : TimePoint = this.getAttributeValueByInjectionId(trackingSet.tracker, item, this.INJECTION_ID_PIVOT_TIME);
        
        const _duration = this.getAttributeValueByInjectionId(trackingSet.tracker, item, this.INJECTION_ID_DURATION);

        const duration: number = _duration? Number(_duration.toString()) : null

        const productivity : Array<number> = this.getAttributeValueByInjectionId(trackingSet.tracker, item, this.INJECTION_ID_PRODUCTIVITY);
        
        if(pivotType && pivotTime && duration && productivity && productivity.length > 0){
          const pivotMoment = pivotTime.toMoment()
          var startMoment: Moment
          var endMoment: Moment

          if(pivotType === 0){
            //pivot is start
            startMoment = pivotMoment.clone()
            endMoment = pivotMoment.clone()
            endMoment.add(duration, "minutes")
          } else {
            //pivot is end
            endMoment = pivotMoment.clone()
            startMoment = pivotMoment.clone()
            startMoment.subtract(duration, "minutes")
          }

          //divide into logs if exceeds.

          const startDayStart = startMoment.clone().startOf('day')
          const startRatio = startMoment.diff(startDayStart, 'day', true)
          const endDiffRatio = endMoment.diff(startDayStart, 'day', true)
          const numDaysBetween = Math.floor(endDiffRatio)
          
          logs.push(
            {
              dateStart: startDayStart.toDate().getTime(),
              fromDateRatio: startRatio,
              toDateRatio: Math.min(endDiffRatio, 1),
              productivity: productivity[0],
              item: item
            }
          )

          for(var i = 0; i<numDaysBetween; i++)
          {
            logs.push(
              {
                dateStart: startDayStart.clone().add(1 + i, 'day').toDate().getTime(),
                fromDateRatio: 0,
                toDateRatio: Math.min(endDiffRatio - (1+i), 1),
                productivity: productivity[0],
                item: item
              }
            )
          }
        }
        else{
        }
      });

      this.logs = logs
    }
  }

  getAttributeValueByInjectionId(
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

  constructor() {

    this.productivityColorScale = d3.scaleLinear<d3.RGBColor, number>().domain([0, 2]).interpolate(d3.interpolateHcl).range([d3.rgb("rgb(243, 220, 117)"), d3.rgb("#2387a0")])
  }

  ngOnInit() {}
}

export type TrackingSet = {
  tracker: ITrackerDbEntity;
  items: Array<IItemDbEntity>;
};

/* This log is not 1:1 matched with the items. 
 * The items can be divided into multiple logs if the range exceeds the day.
*/

export class ProductivityLog {
  dateStart: number;
  fromDateRatio: number;
  toDateRatio: number;
  productivity: number;
  item: IItemDbEntity;
}

export interface ProductivityTimelineData {
  logs: Array<ProductivityLog>

}
