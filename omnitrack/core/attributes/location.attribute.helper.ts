import AttributeHelper from "./attribute.helper";
import PropertyHelper from "../properties/property.helper.base";
import PropertyHelperManager from "../properties/property.helper.manager";
import { EPropertyType } from "../properties/property.types";
import { IAttributeDbEntity } from '../db-entity-types';
import attributeTypes from "./attribute-types";
import TypedStringSerializer from '../typed_string_serializer';
import { LatLng } from "../datatypes/field_datatypes";

export class LocationAttributeHelper extends AttributeHelper {
  get typeName(): string{return "Location"}

  get typeNameForSerialization(): string {return TypedStringSerializer.TYPENAME_LATITUDE_LONGITUDE}

  formatAttributeValue(attr: IAttributeDbEntity, value: any): string {
    const latLng = value as LatLng
    return latLng.latitude + ", " + latLng.longitude
  }

  propertyKeys = []

  constructor() {
    super(attributeTypes.ATTR_TYPE_LOCATION)
  }

  getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
    return null
  }

}