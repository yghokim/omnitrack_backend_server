import FieldHelper from "./field.helper";
import PropertyHelper from "../properties/property.helper.base";
import { IFieldDbEntity } from '../db-entity-types';
import fieldTypes from "./field-types";
import TypedStringSerializer from '../typed_string_serializer';
import { LatLng } from "../datatypes/field_datatypes";
import FieldIconTypes from "./field-icon-types";
import { DEFAULT_VALUE_POLICY_FILL_WITH_INTRINSIC_VALUE, FallbackPolicyResolver } from "./fallback-policies";

export class LocationFieldHelper extends FieldHelper {
  get typeName(): string{return "Location"}

  get typeNameForSerialization(): string {return TypedStringSerializer.TYPENAME_LATITUDE_LONGITUDE}

  formatFieldValue(attr: IFieldDbEntity, value: any): string {
    const latLng = value as LatLng
    return latLng.latitude + ", " + latLng.longitude
  }

  propertyKeys = []

  constructor() {
    super(fieldTypes.ATTR_TYPE_LOCATION)
  }

  getPropertyName(propertyKey: string): string{
    return "property"
  }

  getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
    return null
  }

  getSmallIconType(field: IFieldDbEntity): string {
    return FieldIconTypes.ATTR_ICON_SMALL_LOCATION
  }

  makeSupportedFallbackPolicies(){
    const s = super.makeSupportedFallbackPolicies()
    s.push([DEFAULT_VALUE_POLICY_FILL_WITH_INTRINSIC_VALUE, new FallbackPolicyResolver("Current location")])
    return s
  }
}