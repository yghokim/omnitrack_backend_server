import AttributeHelper from "./attribute.helper";
import PropertyHelper from "../properties/property.helper.base";
import PropertyHelperManager from "../properties/property.helper.manager";
import { EPropertyType } from "../properties/property.types";
import { IAttributeDbEntity } from '../db-entity-types';
import attributeTypes from "./attribute-types";
import TypedStringSerializer from '../typed_string_serializer';
import AttributeIconTypes from "./attribute-icon-types";
import { NumberStyle } from "../datatypes/number_style";
import { DEFAULT_VALUE_POLICY_FILL_WITH_INTRINSIC_VALUE, FallbackPolicyResolver } from "./fallback-policies";

export class NumberAttributeHelper extends AttributeHelper {
  get typeName(): string { return "Number" }

  get typeNameForSerialization(): string { return TypedStringSerializer.TYPENAME_BIGDECIMAL }

  formatAttributeValue(attr: IAttributeDbEntity, value: any): string {
    return value.toString()
  }

  static readonly PROPERTY_KEY_NUMBER_STYLE = "style"

  propertyKeys = [NumberAttributeHelper.PROPERTY_KEY_NUMBER_STYLE]

  constructor() {
    super(attributeTypes.ATTR_TYPE_NUMBER)
  }

  getPropertyName(propertyKey: string): string {
    switch (propertyKey) {
      case NumberAttributeHelper.PROPERTY_KEY_NUMBER_STYLE: return "Number Style"
    }
  }

  getPropertyDefaultValue(propertyKey: string): any{
    switch (propertyKey) {
      case NumberAttributeHelper.PROPERTY_KEY_NUMBER_STYLE: return new NumberStyle()
    }
  }

  getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
    switch (propertyKey) {
      case NumberAttributeHelper.PROPERTY_KEY_NUMBER_STYLE:
        return PropertyHelperManager.getHelper(EPropertyType.NumberStyle)
    }
  }

  getSmallIconType(attribute: IAttributeDbEntity): string {
    return AttributeIconTypes.ATTR_ICON_SMALL_NUMBER
  }

  makeSupportedFallbackPolicies(){
    const s = super.makeSupportedFallbackPolicies()
    s.push([DEFAULT_VALUE_POLICY_FILL_WITH_INTRINSIC_VALUE, new FallbackPolicyResolver("Insert zero")])
    return s
  }
}