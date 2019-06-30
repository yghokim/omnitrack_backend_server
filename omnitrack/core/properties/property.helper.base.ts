import { EPropertyType } from "./property.types";

export default class PropertyHelper<T> {
  parsePropertyValue(json: any): T{
    return json as T
  }
  convertPropertyValueToPureJson(propertyValue: T): any{
    return propertyValue
  }
}