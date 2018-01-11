import PropertyHelper from "./property.helper.base";

export default class BooleanPropertyHelper extends PropertyHelper<boolean> {

  deserializePropertyValue(serialized: string): boolean {
    const parsed = JSON.parse(serialized) as boolean
    return parsed
  }
  serializePropertyValue(propertyValue: boolean): string {
    return propertyValue.toString()
  }

}
