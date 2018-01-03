import PropertyHelper from "../properties/property.helper.base";

export default abstract class AttributeHelper {

  constructor(readonly type: number) {

  }

  abstract propertyKeys: Array<string>

  abstract getPropertyHelper<T>(propertyKey: string): PropertyHelper<T>

  getParsedPropertyValue<T>(attribute: any, propertyKey: string): T {
    const propHelper = this.getPropertyHelper<T>(propertyKey)
    if (propHelper) {
      return propHelper.deserializePropertyValue(attribute.properties.find(p => p.key === propertyKey).sVal)
    } else {
      throw new Error("Property helper is not implemented for " + this.type)
    }
  }
}