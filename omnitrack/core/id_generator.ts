import * as uuid from 'uuid';

export default class IdGenerator {
  static generateObjectId(): string {
    return uuid.v1()
  }
  static generateAttributeLocalId(deviceLocalIndex: number, timestampMillis: number, nano: number): string {
    return deviceLocalIndex + "_" + (timestampMillis * 1000 + nano).toString(36)
  }
}