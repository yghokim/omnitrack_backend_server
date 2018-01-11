import PropertyHelper from "../properties/property.helper.base";
import { IAttributeDbEntity } from '../db-entity-types';

export default abstract class AttributeHelper {

  constructor(readonly type: number) {

  }

  abstract get typeName(): string

  abstract propertyKeys: Array<string>

  abstract getPropertyHelper<T>(propertyKey: string): PropertyHelper<T>

  getParsedPropertyValue<T>(attribute: IAttributeDbEntity, propertyKey: string): T {
    const propHelper = this.getPropertyHelper<T>(propertyKey)
    if (propHelper) {
      return propHelper.deserializePropertyValue(attribute.properties.find(p => p.key === propertyKey).sVal)
    } else {
      throw new Error("Property helper is not implemented for " + this.type)
    }
  }

  abstract formatAttributeValue(attr: IAttributeDbEntity, value: any): string
}