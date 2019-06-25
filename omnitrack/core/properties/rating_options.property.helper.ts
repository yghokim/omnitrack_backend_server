import PropertyHelper from './property.helper.base'
import { RatingOptions } from '../datatypes/rating_options'
import { EPropertyType } from './property.types';
export default class RatingOptionsPropertyHelper implements PropertyHelper<RatingOptions> {
  type = EPropertyType.RatingOptions

  deserializePropertyValue(serialized: string): RatingOptions {
    return JSON.parse(serialized) as RatingOptions
  }
  serializePropertyValue(propertyValue: RatingOptions): string {
    return JSON.stringify(propertyValue)
  }

}