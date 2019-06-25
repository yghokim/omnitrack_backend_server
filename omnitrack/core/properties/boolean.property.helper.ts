import PropertyHelper from "./property.helper.base";
import { EPropertyType } from "./property.types";

export default class BooleanPropertyHelper extends PropertyHelper<boolean> {
  
  type = EPropertyType.Boolean

  deserializePropertyValue(serialized: string): boolean {
    const parsed = JSON.parse(serialized) as boolean
    return parsed
  }
  serializePropertyValue(propertyValue: boolean): string {
    return propertyValue.toString()
  }

}
