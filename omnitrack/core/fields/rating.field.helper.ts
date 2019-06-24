import FieldHelper from "./field.helper";
import PropertyHelperManager from "../properties/property.helper.manager";
import { EPropertyType } from "../properties/property.types";
import PropertyHelper from "../properties/property.helper.base";
import { IFieldDbEntity } from "../db-entity-types";
import { Fraction } from "../datatypes/field_datatypes";
import fieldTypes from "./field-types";
import { RatingOptions } from "../datatypes/rating_options";
import TypedStringSerializer from '../typed_string_serializer';
import FieldIconTypes from "./field-icon-types";
import { FallbackPolicyResolver, DEFAULT_VALUE_POLICY_FILL_WITH_INTRINSIC_VALUE } from "./fallback-policies";


class MiddleValueFallbackPolicyResolver extends FallbackPolicyResolver{
  constructor(){
    super("The midpoint score")
  }
}

export class RatingFieldHelper extends FieldHelper {

  get typeName(): string { return "Rating" }

  get typeNameForSerialization(): string{ return TypedStringSerializer.TYPENAME_FRACTION}

  formatFieldValue(attr: IFieldDbEntity, value: any): string {
    if(value instanceof Fraction)
    {
      const ratingOptions = this.getParsedPropertyValue<RatingOptions>(attr, RatingFieldHelper.PROPERTY_KEY_OPTIONS)
      
      return (value.upper/value.under).toFixed(2)
    }
    else{
      return value.toString()
    }
  }

  constructor() {
    super(fieldTypes.ATTR_TYPE_RATING)
  }

  static readonly PROPERTY_KEY_OPTIONS = "options"

  propertyKeys: string[] = [RatingFieldHelper.PROPERTY_KEY_OPTIONS];

  getPropertyName(propertyKey: string): string{
    switch (propertyKey) {
      case RatingFieldHelper.PROPERTY_KEY_OPTIONS:
          return "Rating Options"
    }
  }

  getPropertyDefaultValue(propertyKey: string): any{
    switch (propertyKey) {
      case RatingFieldHelper.PROPERTY_KEY_OPTIONS:
          return new RatingOptions()
    }
  }
  
  getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
    switch (propertyKey) {
      case RatingFieldHelper.PROPERTY_KEY_OPTIONS:
      return PropertyHelperManager.getHelper(EPropertyType.RatingOptions)
    }
  }

  getSmallIconType(field: IFieldDbEntity): string {
    return FieldIconTypes.ATTR_ICON_SMALL_STAR
  }

  makeSupportedFallbackPolicies(){
    const s = super.makeSupportedFallbackPolicies()
    s.push([DEFAULT_VALUE_POLICY_FILL_WITH_INTRINSIC_VALUE, new MiddleValueFallbackPolicyResolver()])
    return s
  }
  
}