import PropertyHelper from "./property.helper.base";
import { EPropertyType } from "./property.types";

export default class SelectionPropertyHelper extends PropertyHelper<number> {

  type = EPropertyType.Selection

  deserializePropertyValue(serialized: string): number {
    const parsed = parseInt(serialized)
    return parsed
  }

  serializePropertyValue(propertyValue: number): string {
    return propertyValue.toString()
  }

}
