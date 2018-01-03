import PropertyHelper from './property.helper.base'
import { RatingOptions } from '../datatypes/rating_options'
export default class RatingOptionsPropertyHelper implements PropertyHelper<RatingOptions> {
  deserializePropertyValue(serialized: string): RatingOptions {
    return JSON.parse(serialized) as RatingOptions
  }
  serializePropertyValue(propertyValue: RatingOptions): string {
    return JSON.stringify(propertyValue)
  }

}