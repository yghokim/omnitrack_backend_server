import FieldHelper from "./field.helper";
import PropertyHelperManager from "../properties/property.helper.manager";
import { EPropertyType } from "../properties/property.types";
import PropertyHelper from "../properties/property.helper.base";
import { IFieldDbEntity } from "../db-entity-types";
import { Fraction, TimeSpan } from "../datatypes/field_datatypes";
import fieldTypes from "./field-types";
import * as moment from 'moment-timezone';
import TypedStringSerializer from '../typed_string_serializer';
import FieldIconTypes from "./field-icon-types";
import { DEFAULT_VALUE_POLICY_FILL_WITH_INTRINSIC_VALUE, FallbackPolicyResolver } from "./fallback-policies";

export class TimeSpanFieldHelper extends FieldHelper {
  static readonly PROPERTY_GRANULARITY = "granularity"
  static readonly PROPERTY_TYPE = "type"

  static readonly GRANULARITY_DAY = 0
  static readonly GRANULARITY_MINUTE = 1

  static readonly TIMEFORMAT_TIME = "kk:mm"
  static readonly TIMEFORMAT_DATE = "MMM DD YYYY"
  static readonly TIMEFORMAT_YEARDATE = "YYYY-MM-DD"
 
  static readonly FALLBACK_POLICY_CONNECT_PREVIOUS = "connect"

  get typeName(): string { return "Time Range" }
  get typeNameForSerialization(): string { return TypedStringSerializer.TYPENAME_TIMESPAN }

  formatFieldValue(attr: IFieldDbEntity, value: any): string {
    if(value instanceof TimeSpan)
    {
      const granularity = this.getParsedPropertyValue<number>(attr, TimeSpanFieldHelper.PROPERTY_GRANULARITY)
      const timezoneName = moment().tz(value.timezone).format("z")
      const fromMoment = moment(value.from).tz(value.timezone)
      const toMoment = moment(value.from + value.duration).tz(value.timezone)
      
      switch(granularity){
        case TimeSpanFieldHelper.GRANULARITY_DAY:
          const format = TimeSpanFieldHelper.TIMEFORMAT_YEARDATE
          return fromMoment.format(format) + " ~ " + toMoment.format(format) + " " + timezoneName
        case TimeSpanFieldHelper.GRANULARITY_MINUTE:
          const fromTimePart = fromMoment.format(TimeSpanFieldHelper.TIMEFORMAT_TIME)
          const fromDatePart = fromMoment.format(TimeSpanFieldHelper.TIMEFORMAT_DATE)
          const toTimePart = toMoment.format(TimeSpanFieldHelper.TIMEFORMAT_TIME)
          const toDatePart = toMoment.format(TimeSpanFieldHelper.TIMEFORMAT_DATE)
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
    super(fieldTypes.ATTR_TYPE_TIMESPAN)
  }

  propertyKeys: string[] = [TimeSpanFieldHelper.PROPERTY_GRANULARITY];

  getPropertyName(propertyKey: string): string{
    switch(propertyKey){
      case TimeSpanFieldHelper.PROPERTY_GRANULARITY: return "Granularity"
    }
  }

  getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
    switch (propertyKey) {
      case TimeSpanFieldHelper.PROPERTY_GRANULARITY:
      return PropertyHelperManager.getHelper(EPropertyType.Selection)
    }
  }

  getPropertyConfig(propertyKey: string): any {
    switch (propertyKey) {
      case TimeSpanFieldHelper.PROPERTY_GRANULARITY:
        return {
          list: [
            { id: TimeSpanFieldHelper.GRANULARITY_MINUTE, name: "Minute" },
            { id: TimeSpanFieldHelper.GRANULARITY_DAY, name: "Day" }]
        }
    }
  }

  getPropertyDefaultValue(propertyKey: string): any{
    switch (propertyKey) {
      case TimeSpanFieldHelper.PROPERTY_GRANULARITY:
        return TimeSpanFieldHelper.GRANULARITY_DAY
    }
  }
  
  
  getSmallIconType(field: IFieldDbEntity): string {
    return FieldIconTypes.ATTR_ICON_SMALL_TIMER
  }  

  makeSupportedFallbackPolicies(){
    const s = super.makeSupportedFallbackPolicies()
    s.push([DEFAULT_VALUE_POLICY_FILL_WITH_INTRINSIC_VALUE, new FallbackPolicyResolver("Present")])

    s.push([TimeSpanFieldHelper.FALLBACK_POLICY_CONNECT_PREVIOUS, new FallbackPolicyResolver("Start from the end of the previous item")])

    return s
  }

}