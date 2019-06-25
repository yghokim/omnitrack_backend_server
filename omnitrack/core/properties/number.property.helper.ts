import PropertyHelper from "./property.helper.base";
import { EPropertyType } from "./property.types";
export default class NumberPropertyHelper extends PropertyHelper<number>{
  type = EPropertyType.Number

  deserializePropertyValue(serialized: string): number {
    return Number(serialized)
  }
  serializePropertyValue(propertyValue: number): string {
    return propertyValue.toString();
  }

}