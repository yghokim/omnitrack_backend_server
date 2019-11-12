import FieldHelper from "./field.helper";
import PropertyHelper from "../properties/property.helper.base";
import PropertyHelperManager from "../properties/property.helper.manager";
import { EPropertyType } from "../properties/property.types";
import { IFieldDbEntity } from '../db-entity-types';
import fieldTypes from "./field-types";
import TypedStringSerializer from '../typed_string_serializer';
import FieldIconTypes from "./field-icon-types";
import { NumberStyle } from "../datatypes/number_style";
import { DEFAULT_VALUE_POLICY_FILL_WITH_INTRINSIC_VALUE, FallbackPolicyResolver } from "./fallback-policies";

export class NumberFieldHelper extends FieldHelper {
  get typeName(): string { return "Number" }

  get typeNameForSerialization(): string { return TypedStringSerializer.TYPENAME_BIGDECIMAL }

  formatFieldValue(attr: IFieldDbEntity, value: any): string {
    return value.toString()
  }

  static readonly PROPERTY_KEY_NUMBER_STYLE = "style"

  propertyKeys = [NumberFieldHelper.PROPERTY_KEY_NUMBER_STYLE]

  constructor() {
    super(fieldTypes.ATTR_TYPE_NUMBER)
  }

  getPropertyName(propertyKey: string): string {
    switch (propertyKey) {
      case NumberFieldHelper.PROPERTY_KEY_NUMBER_STYLE: return "Number Style"
    }
  }

  getPropertyDefaultValue(propertyKey: string): any{
    switch (propertyKey) {
      case NumberFieldHelper.PROPERTY_KEY_NUMBER_STYLE: return new NumberStyle()
    }
  }

  getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
    switch (propertyKey) {
      case NumberFieldHelper.PROPERTY_KEY_NUMBER_STYLE:
        return PropertyHelperManager.getHelper(EPropertyType.NumberStyle)
    }
  }

  getPropertyType(propertyKey: string): EPropertyType {
    switch (propertyKey) {
      case NumberFieldHelper.PROPERTY_KEY_NUMBER_STYLE:
        return EPropertyType.NumberStyle
    }
  }

  getSmallIconType(field: IFieldDbEntity): string {
    return FieldIconTypes.ATTR_ICON_SMALL_NUMBER
  }

  makeSupportedFallbackPolicies(){
    const s = super.makeSupportedFallbackPolicies()
    s.push([DEFAULT_VALUE_POLICY_FILL_WITH_INTRINSIC_VALUE, new FallbackPolicyResolver("Insert zero")])
    return s
  }
}