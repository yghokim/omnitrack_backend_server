import PropertyHelper from "./property.helper.base";

export default class SelectionPropertyHelper extends PropertyHelper<number> {

  deserializePropertyValue(serialized: string): number {
    const parsed = parseInt(serialized)
    return parsed
  }

  serializePropertyValue(propertyValue: number): string {
    return propertyValue.toString()
  }

}
