import AttributeHelper from "./attribute.helper";
import PropertyHelper from "../properties/property.helper.base";
import PropertyHelperManager from "../properties/property.helper.manager";
import { EPropertyType } from "../properties/property.types";
import { IAttributeDbEntity } from '../db-entity-types';
import attributeTypes from "./attribute-types";

export default class NumberAttributeHelper extends AttributeHelper {
  get typeName(): string{return "Number"}

  formatAttributeValue(attr: IAttributeDbEntity, value: any): string {
    return value.toString()
  }

  static readonly PROPERTY_KEY_NUMBER_STYLE = "style"

  propertyKeys = [NumberAttributeHelper.PROPERTY_KEY_NUMBER_STYLE]

  constructor() {
    super(attributeTypes.ATTR_TYPE_NUMBER)
  }

  getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
    switch (propertyKey) {
      case NumberAttributeHelper.PROPERTY_KEY_NUMBER_STYLE:
        return PropertyHelperManager.getHelper(EPropertyType.NumberStyle)
    }
  }

}