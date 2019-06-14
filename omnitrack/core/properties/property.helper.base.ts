import { EPropertyType } from "./property.types";

export default abstract class PropertyHelper<T> {
  abstract type: EPropertyType
  abstract deserializePropertyValue(serialized: string): T
  abstract serializePropertyValue(propertyValue: T): string
}