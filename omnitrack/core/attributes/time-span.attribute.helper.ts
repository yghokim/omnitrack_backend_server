import AttributeHelper from "./attribute.helper";
import PropertyHelperManager from "../properties/property.helper.manager";
import { EPropertyType } from "../properties/property.types";
import PropertyHelper from "../properties/property.helper.base";
import { IAttributeDbEntity } from "../db-entity-types";
import { Fraction, TimeSpan } from "../datatypes/field_datatypes";
import attributeTypes from "./attribute-types";
import * as moment from 'moment-timezone';
import TypedStringSerializer from '../typed_string_serializer';

export class TimeSpanAttributeHelper extends AttributeHelper {  

  static readonly PROPERTY_GRANULARITY = "granularity"
  static readonly PROPERTY_TYPE = "type"

  static readonly GRANULARITY_DAY = 0
  static readonly GRANULARITY_MINUTE = 1

  static readonly TIMEFORMAT_TIME = "kk:mm"
  static readonly TIMEFORMAT_DATE = "MMM DD YYYY"
  static readonly TIMEFORMAT_YEARDATE = "YYYY-MM-DD"
  

  get typeName(): string { return "Time Range" }
  get typeNameForSerialization(): string { return TypedStringSerializer.TYPENAME_TIMESPAN }

  formatAttributeValue(attr: IAttributeDbEntity, value: any): string {
    if(value instanceof TimeSpan)
    {
      const granularity = this.getParsedPropertyValue<number>(attr, TimeSpanAttributeHelper.PROPERTY_GRANULARITY)
      const timezoneName = moment().tz(value.timezone).format("z")
      const fromMoment = moment(value.from).tz(value.timezone)
      const toMoment = moment(value.from + value.duration).tz(value.timezone)
      
      switch(granularity){
        case TimeSpanAttributeHelper.GRANULARITY_DAY:
          const format = TimeSpanAttributeHelper.TIMEFORMAT_YEARDATE
          return fromMoment.format(format) + " ~ " + toMoment.format(format) + " " + timezoneName
        case TimeSpanAttributeHelper.GRANULARITY_MINUTE:
          const fromTimePart = fromMoment.format(TimeSpanAttributeHelper.TIMEFORMAT_TIME)
          const fromDatePart = fromMoment.format(TimeSpanAttributeHelper.TIMEFORMAT_DATE)
          const toTimePart = toMoment.format(TimeSpanAttributeHelper.TIMEFORMAT_TIME)
          const toDatePart = toMoment.format(TimeSpanAttributeHelper.TIMEFORMAT_DATE)
          if(fromDatePart === toDatePart)
          {
            return fromTimePart + " ~ " + toTimePart + " (" + toDatePart + ") " + timezoneName
          }
          else return fromTimePart + " (" + fromDatePart + ") ~ " + toTimePart + " (" + toDatePart + ") " + timezoneName
      }
    }

    return value.toString()
  }

  constructor() {
    super(attributeTypes.ATTR_TYPE_TIMESPAN)
  }

  propertyKeys: string[] = [TimeSpanAttributeHelper.PROPERTY_GRANULARITY];

  getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
    switch (propertyKey) {
      case TimeSpanAttributeHelper.PROPERTY_GRANULARITY:
      return PropertyHelperManager.getHelper(EPropertyType.Selection)
    }
  }

  
}