import AttributeHelper from "./attribute.helper";
import PropertyHelperManager from "../properties/property.helper.manager";
import { EPropertyType } from "../properties/property.types";
import PropertyHelper from "../properties/property.helper.base";
import { IAttributeDbEntity } from "../db-entity-types";
import { TimePoint } from "../datatypes/field_datatypes";
import attributeTypes from "./attribute-types";
import * as moment from 'moment-timezone';
import { TimeSpanAttributeHelper } from './time-span.attribute.helper';
import TypedStringSerializer from '../typed_string_serializer';
import AttributeIconTypes from "./attribute-icon-types";

export class TimePointAttributeHelper extends AttributeHelper {
  get typeName(): string { return "Time Point" }
  get typeNameForSerialization(): string { return TypedStringSerializer.TYPENAME_TIMEPOINT}

  formatAttributeValue(attr: IAttributeDbEntity, value: any): string {
    if(value instanceof TimePoint)
    {
      const granularity = this.getParsedPropertyValue<number>(attr, TimePointAttributeHelper.PROPERTY_GRANULARITY)
      let format
      switch(granularity){
        case TimePointAttributeHelper.GRANULARITY_DAY:
        format = TimeSpanAttributeHelper.TIMEFORMAT_YEARDATE
        break;
        case TimePointAttributeHelper.GRANULARITY_MINUTE:
        format = TimeSpanAttributeHelper.TIMEFORMAT_TIME + " (" + TimeSpanAttributeHelper.TIMEFORMAT_DATE + ")"
        break;
      }

      return value.toMoment().format(format)
      + " " + moment().tz(value.timezone).format("z")
    }
    else{
      return value.toString()
    }
  }

  constructor() {
    super(attributeTypes.ATTR_TYPE_TIMESPAN)
  }

  static readonly PROPERTY_GRANULARITY = "granularity"

  static readonly GRANULARITY_DAY = 0
  static readonly GRANULARITY_MINUTE = 1
  static readonly GRANULARITY_SECOND = 2
  

  propertyKeys: string[] = [TimePointAttributeHelper.PROPERTY_GRANULARITY];

  getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
    switch (propertyKey) {
      case TimePointAttributeHelper.PROPERTY_GRANULARITY:
      return PropertyHelperManager.getHelper(EPropertyType.Selection)
    }
  }

  getSmallIconType(attribute: IAttributeDbEntity): string {
    return AttributeIconTypes.ATTR_ICON_SMALL_TIME
  }
  
}