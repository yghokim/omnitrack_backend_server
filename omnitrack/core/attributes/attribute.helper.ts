import PropertyHelper from "../properties/property.helper.base";
import { IAttributeDbEntity } from '../db-entity-types';

export default abstract class AttributeHelper {

  constructor(readonly type: number) {

  }

  abstract get typeName(): string

  abstract get typeNameForSerialization(): string

  abstract propertyKeys: Array<string>

  abstract getPropertyHelper<T>(propertyKey: string): PropertyHelper<T>

  getParsedPropertyValue<T>(attribute: IAttributeDbEntity, propertyKey: string): T {
    const propHelper = this.getPropertyHelper<T>(propertyKey)
    if (propHelper) {
      const propertyEntry = attribute.properties.find(p => p.key === propertyKey)
      if(propertyEntry != null)
      {
        return propHelper.deserializePropertyValue(propertyEntry.sVal)
      }else{
        return this.getPropertyDefaultValue(propertyKey)
      }
    } else {
      throw new Error("Property helper is not implemented for " + this.type)
    }
  }

  getPropertyDefaultValue(propertyKey: string): any{
    return null
  }

  getPropertyConfig(propertyKey: string): any{
    return null
  }

  setPropertyValue<T>(attribute: IAttributeDbEntity, propertyKey: string, value: T){
    const propHelper = this.getPropertyHelper<T>(propertyKey)
    if (propHelper) {
      const sVal = propHelper.serializePropertyValue(value)
      if(attribute.properties){
        const match = attribute.properties.find(p => p.key === propertyKey)
        if(match){
          match.sVal = sVal
        }else{
          attribute.properties.push({key: propertyKey, sVal: sVal})
        }
      }else{
        attribute.properties = [{key: propertyKey, sVal: sVal}]
      }

    } else {
      throw new Error("Property helper is not implemented for " + this.type)
    }
  }

  initialize(attribute: IAttributeDbEntity){
    this.propertyKeys.forEach(key => {
      this.setPropertyValue(attribute, key, this.getPropertyDefaultValue(key))
    })
  }

  abstract getPropertyName(propertyKey: string): string

  abstract getSmallIconType(attribute: IAttributeDbEntity): string

  abstract formatAttributeValue(attr: IAttributeDbEntity, value: any): string
}