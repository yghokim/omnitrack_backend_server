import PropertyHelper from "../properties/property.helper.base";
import { IFieldDbEntity } from '../db-entity-types';
import { FallbackPolicyResolver, DEFAULT_VALUE_POLICY_NULL, NullValueResolver, DEFAULT_VALUE_POLICY_FILL_WITH_LAST_ITEM, PreviousValueResolver } from "./fallback-policies";

export default abstract class FieldHelper {

  constructor(readonly type: number) {

  }

  abstract get typeName(): string

  abstract get typeNameForSerialization(): string

  abstract propertyKeys: Array<string>

  supportedFallbackPolicyKeys = new Map<string, FallbackPolicyResolver>(this.makeSupportedFallbackPolicies())

  abstract getPropertyHelper<T>(propertyKey: string): PropertyHelper<T>

  getParsedPropertyValue<T>(field: IFieldDbEntity, propertyKey: string): T {
    const propHelper = this.getPropertyHelper<T>(propertyKey)
    if (propHelper) {
      const propertyEntry = field.properties.find(p => p.key === propertyKey)
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

  setPropertyValue<T>(field: IFieldDbEntity, propertyKey: string, value: T){
    const propHelper = this.getPropertyHelper<T>(propertyKey)
    if (propHelper) {
      const sVal = propHelper.serializePropertyValue(value)
      if(field.properties){
        const match = field.properties.find(p => p.key === propertyKey)
        if(match){
          match.sVal = sVal
        }else{
          field.properties.push({key: propertyKey, sVal: sVal})
        }
      }else{
        field.properties = [{key: propertyKey, sVal: sVal}]
      }

    } else {
      throw new Error("Property helper is not implemented for " + this.type)
    }
  }

  initialize(field: IFieldDbEntity){
    this.propertyKeys.forEach(key => {
      this.setPropertyValue(field, key, this.getPropertyDefaultValue(key))
    })
  }

  mergeFieldProperties(source: IFieldDbEntity, dest: IFieldDbEntity, writeTo: IFieldDbEntity = dest){
    this.propertyKeys.forEach(key => {
      this.setPropertyValue(writeTo, key, this.mergeFieldPropertyValue(source, dest, key, this.getParsedPropertyValue(source, key), this.getParsedPropertyValue(dest, key)))
    })
  }

  mergeFieldPropertyValue(source: IFieldDbEntity, dest: IFieldDbEntity, propertyKey: string, sourceValue: any, destValue: any): any{
    return sourceValue
  }

  abstract getPropertyName(propertyKey: string): string

  abstract getSmallIconType(field: IFieldDbEntity): string

  abstract formatFieldValue(attr: IFieldDbEntity, value: any): string

  makeSupportedFallbackPolicies(): Array<[string, FallbackPolicyResolver]>{
    return [
      [DEFAULT_VALUE_POLICY_NULL, new NullValueResolver()],
      [DEFAULT_VALUE_POLICY_FILL_WITH_LAST_ITEM, new PreviousValueResolver()]
    ]
  }
}