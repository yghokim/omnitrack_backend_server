import { Component, OnInit, Input } from "@angular/core";
import AttributeHelper from "../../../../../omnitrack/core/attributes/attribute.helper";
import AttributeManager from "../../../../../omnitrack/core/attributes/attribute.manager";
import TypedStringSerializer from "../../../../../omnitrack/core/typed_string_serializer";
import {
  IItemDbEntity,
  ITrackerDbEntity
} from "../../../../../omnitrack/core/db-entity-types";
import { TimePoint } from "../../../../../omnitrack/core/datatypes/field_datatypes";

@Component({
  selector: "app-productivity-timeline",
  templateUrl: "./productivity-timeline.component.html",
  styleUrls: ["./productivity-timeline.component.scss"]
})
export class ProductivityTimelineComponent implements OnInit {
  private readonly INJECTION_ID_PIVOT_TYPE = "OZLc8BKS";
  private readonly INJECTION_ID_PIVOT_TIME = "UDTGuxJm";
  private readonly INJECTION_ID_DURATION = "uyMhOEin";
  private readonly INJECTION_ID_PRODUCTIVITY = "QizUYovc";

  private trackingSet: TrackingSet;
  private logs: Array<ProductivityLog> = [];

  @Input("trackingSet")
  set _trackingSet(trackingSet: TrackingSet) {
    this.trackingSet = trackingSet;

    if (trackingSet) {
      this.logs = trackingSet.items.map(item => {
        const log = new ProductivityLog();

        log.item = item;
        const pivotType : number = this.getAttributeValueByInjectionId(trackingSet.tracker, item, this.INJECTION_ID_PIVOT_TYPE);
        const pivotTime : TimePoint = this.getAttributeValueByInjectionId(trackingSet.tracker, item, this.INJECTION_ID_PIVOT_TIME);
        const duration : number = this.getAttributeValueByInjectionId(trackingSet.tracker, item, this.INJECTION_ID_DURATION);
        const productivity : number = this.getAttributeValueByInjectionId(trackingSet.tracker, item, this.INJECTION_ID_PRODUCTIVITY);
        
        
        return log;
      });
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

  constructor() {}

  ngOnInit() {}
}

export type TrackingSet = {
  tracker: ITrackerDbEntity;
  items: Array<IItemDbEntity>;
};

class ProductivityLog {
  startAt: Date;
  endAt: Date;
  startRatio: number;
  endRatio: number;
  productivity: number;
  item: IItemDbEntity;
}
