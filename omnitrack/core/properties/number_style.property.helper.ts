import PropertyHelper from "./property.helper.base";
import { NumberStyle } from "../datatypes/number_style";

export default class NumberStylePropertyHelper extends PropertyHelper<NumberStyle>{

  deserializePropertyValue(serialized: string): NumberStyle {
    const parsed = JSON.parse(serialized) as NumberStyle
    return parsed
  }
  serializePropertyValue(propertyValue: NumberStyle): string {
    return JSON.stringify(propertyValue)
  }

}
