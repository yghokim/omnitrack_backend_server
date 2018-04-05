import AttributeHelper from "./attribute.helper";
import PropertyHelperManager from "../properties/property.helper.manager";
import { EPropertyType } from "../properties/property.types";
import PropertyHelper from "../properties/property.helper.base";
import { IAttributeDbEntity } from "../db-entity-types";
import { Fraction } from "../datatypes/field_datatypes";
import attributeTypes from "./attribute-types";
import { RatingOptions } from "../datatypes/rating_options";
import TypedStringSerializer from '../typed_string_serializer';

export default class RatingAttributeHelper extends AttributeHelper {
  get typeName(): string { return "Rating" }

  get typeNameForSerialization(): string{ return TypedStringSerializer.TYPENAME_FRACTION}

  formatAttributeValue(attr: IAttributeDbEntity, value: any): string {
    if(value instanceof Fraction)
    {
      const ratingOptions = this.getParsedPropertyValue<RatingOptions>(attr, RatingAttributeHelper.PROPERTY_KEY_OPTIONS)
      
      return (value.upper/value.under).toFixed(2)
    }
    else{
      return value.toString()
    }
  }

  constructor() {
    super(attributeTypes.ATTR_TYPE_RATING)
  }

  static readonly PROPERTY_KEY_OPTIONS = "options"

  propertyKeys: string[] = [RatingAttributeHelper.PROPERTY_KEY_OPTIONS];

  getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
    switch (propertyKey) {
      case RatingAttributeHelper.PROPERTY_KEY_OPTIONS:
      return PropertyHelperManager.getHelper(EPropertyType.RatingOptions)
    }
  }

  
}