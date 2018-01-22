import PropertyHelper from "./property.helper.base";
export default class NumberPropertyHelper extends PropertyHelper<number>{
  deserializePropertyValue(serialized: string): number {
    return Number(serialized)
  }
  serializePropertyValue(propertyValue: number): string {
    return propertyValue.toString();
  }

}