import { Component, OnInit, Input } from "@angular/core";
import {
  IItemDbEntity,
  ITrackerDbEntity
} from "../../../../../omnitrack/core/db-entity-types";
import TypedStringSerializer from "../../../../../omnitrack/core/typed_string_serializer";
import * as d3 from "d3";
import { TimePoint, ServerFile } from "../../../../../omnitrack/core/datatypes/field_datatypes";
import { Moment } from "moment";
import { ScaleLinear } from "d3";
import PropertyHelperManager from "../../../../../omnitrack/core/properties/property.helper.manager";
import { EPropertyType } from "../../../../../omnitrack/core/properties/property.types";
import ChoiceAttributeHelper from "../../../../../omnitrack/core/attributes/choice.attribute.helper";
import { TrackingSet, DecodedItem, ProductivityLog, OmitLog, ProductivityHelper } from "../productivity-helper";

@Component({
  selector: "app-productivity-dashboard",
  templateUrl: "./productivity-dashboard.component.html",
  styleUrls: ["./productivity-dashboard.component.scss"]
})
export class ProductivityDashboardComponent implements OnInit {
  
  private trackingSet: TrackingSet;
  decodedItems: Array<DecodedItem> = [];
  logs: Array<ProductivityLog> = [];
  omitLogs: Array<OmitLog> = [];
  overrideStartDate: number

  productivityColorScale: ScaleLinear<
    d3.RGBColor,
    string
    > = ProductivityHelper.productivityColorScale;

  @Input("trackingSet")
  set _trackingSet(trackingSet: TrackingSet) {
    this.trackingSet = trackingSet;

    if (trackingSet) {
      const processed = ProductivityHelper.processTrackingSet(trackingSet)

      this.logs = processed.productivityLogs;
      this.decodedItems = processed.decodedItems;
      this.omitLogs = processed.omitLogs;
    }
  }

  constructor() { }

  ngOnInit() { }
}