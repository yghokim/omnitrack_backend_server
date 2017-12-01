export default abstract class PropertyHelper<T>{
  abstract deserializePropertyValue(serialized: string): T
  abstract serializePropertyValue(propertyValue: T): string
}