import FieldHelper from "./field.helper";
import PropertyHelperManager from "../properties/property.helper.manager";
import { EPropertyType } from "../properties/property.types";
import PropertyHelper from "../properties/property.helper.base";
import { IFieldDbEntity } from "../db-entity-types";
import { TimePoint } from "../datatypes/field_datatypes";
import fieldTypes from "./field-types";
import * as moment from 'moment-timezone';
import { TimeSpanFieldHelper } from './time-span.field.helper';
import TypedStringSerializer from '../typed_string_serializer';
import FieldIconTypes from "./field-icon-types";
import { DEFAULT_VALUE_POLICY_FILL_WITH_INTRINSIC_VALUE, FallbackPolicyResolver } from "./fallback-policies";

export class TimePointFieldHelper extends FieldHelper {
  get typeName(): string { return "Time Point" }
  get typeNameForSerialization(): string { return TypedStringSerializer.TYPENAME_TIMEPOINT }

  formatFieldValue(attr: IFieldDbEntity, value: any): string {
    if (value instanceof TimePoint) {
      const granularity = this.getParsedPropertyValue<number>(attr, TimePointFieldHelper.PROPERTY_GRANULARITY)
      let format
      switch (granularity) {
        case TimePointFieldHelper.GRANULARITY_DAY:
          format = TimeSpanFieldHelper.TIMEFORMAT_YEARDATE
          break;
        case TimePointFieldHelper.GRANULARITY_MINUTE:
          format = TimeSpanFieldHelper.TIMEFORMAT_TIME + " (" + TimeSpanFieldHelper.TIMEFORMAT_DATE + ")"
          break;
      }

      return value.toMoment().format(format)
        + " " + moment().tz(value.timezone).format("z")
    }
    else {
      return value.toString()
    }
  }

  constructor() {
    super(fieldTypes.ATTR_TYPE_TIMESPAN)
  }

  static readonly PROPERTY_GRANULARITY = "granularity"

  static readonly GRANULARITY_DAY = 0
  static readonly GRANULARITY_MINUTE = 1
  static readonly GRANULARITY_SECOND = 2

  getPropertyName(propertyKey: string): string {
    switch (propertyKey) {
      case TimePointFieldHelper.PROPERTY_GRANULARITY: return "Granularity"
    }
  }

  propertyKeys: string[] = [TimePointFieldHelper.PROPERTY_GRANULARITY];

  getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
    switch (propertyKey) {
      case TimePointFieldHelper.PROPERTY_GRANULARITY:
        return PropertyHelperManager.getHelper(EPropertyType.Selection)
    }
  }

  getPropertyType(propertyKey: string): EPropertyType {
    switch (propertyKey) {
      case TimePointFieldHelper.PROPERTY_GRANULARITY:
        return EPropertyType.Selection
    }
  }

  getPropertyConfig(propertyKey: string): any {
    switch (propertyKey) {
      case TimePointFieldHelper.PROPERTY_GRANULARITY:
        return {
          list: [
            { id: TimePointFieldHelper.GRANULARITY_SECOND, name: "Second" },
            { id: TimePointFieldHelper.GRANULARITY_MINUTE, name: "Minute" },
            { id: TimePointFieldHelper.GRANULARITY_DAY, name: "Day" }]
        }
    }
  }
  
  getPropertyDefaultValue(propertyKey: string): any{
    switch (propertyKey) {
      case TimePointFieldHelper.PROPERTY_GRANULARITY:
        return TimePointFieldHelper.GRANULARITY_DAY
    }
  }

  getSmallIconType(field: IFieldDbEntity): string {
    return FieldIconTypes.ATTR_ICON_SMALL_TIME
  }

  makeSupportedFallbackPolicies(){
    const s = super.makeSupportedFallbackPolicies()
    s.push([DEFAULT_VALUE_POLICY_FILL_WITH_INTRINSIC_VALUE, new FallbackPolicyResolver("Present")])
    return s
  }

}