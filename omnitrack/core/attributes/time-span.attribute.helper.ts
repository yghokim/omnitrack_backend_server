import AttributeHelper from "./attribute.helper";
import PropertyHelperManager from "../properties/property.helper.manager";
import { EPropertyType } from "../properties/property.types";
import PropertyHelper from "../properties/property.helper.base";
import { IAttributeDbEntity } from "../db-entity-types";
import { Fraction, TimeSpan } from "../datatypes/field_datatypes";
import attributeTypes from "./attribute-types";
import * as moment from 'moment-timezone';

export default class TimeSpanAttributeHelper extends AttributeHelper {
  get typeName(): string { return "Time Range" }

  formatAttributeValue(attr: IAttributeDbEntity, value: any): string {
    if(value instanceof TimeSpan)
    {
      const granularity = this.getParsedPropertyValue<number>(attr, TimeSpanAttributeHelper.PROPERTY_GRANULARITY)
      let format
      switch(granularity){
        case TimeSpanAttributeHelper.GRANULARITY_DAY:
        format = "YYYY-MM-DD"
        break;
        case TimeSpanAttributeHelper.GRANULARITY_MINUTE:
        format = "kk:mm (MMM DD YYYY)"
        break;
      }

      return moment(value.from).tz(value.timezone).format(format) 
      + " ~ " + moment(value.from + value.duration).tz(value.timezone).format(format)
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
  static readonly PROPERTY_TYPE = "type"

  static readonly GRANULARITY_DAY = 0
  static readonly GRANULARITY_MINUTE = 1

  propertyKeys: string[] = [TimeSpanAttributeHelper.PROPERTY_GRANULARITY];

  getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
    switch (propertyKey) {
      case TimeSpanAttributeHelper.PROPERTY_GRANULARITY:
      return PropertyHelperManager.getHelper(EPropertyType.Selection)
    }
  }

  
}