import AttributeHelper from "./attribute.helper";
import { RatingAttributeHelper } from "./rating.attribute.helper";
import { NumberAttributeHelper } from "./number.attribute.helper";
import attributeTypes from "./attribute-types";
import { ChoiceAttributeHelper } from './choice.attribute.helper';
import { TimeSpanAttributeHelper } from "./time-span.attribute.helper";
import { TimePointAttributeHelper } from "./time-point.attribute.helper";
import { LocationAttributeHelper } from './location.attribute.helper';

export default class AttributeManager {

  private static readonly dict = {}

  static getHelper(type: number): AttributeHelper {
    const helper = AttributeManager.dict[type.toString()]
    if (helper instanceof AttributeHelper) {
      return helper
    } else {
      switch (type) {
        case attributeTypes.ATTR_TYPE_RATING:
          AttributeManager.dict[type.toString()] = new RatingAttributeHelper()
        break;
        case attributeTypes.ATTR_TYPE_NUMBER:
          AttributeManager.dict[type.toString()] = new NumberAttributeHelper() 
        break;
        case attributeTypes.ATTR_TYPE_CHOICE:
          AttributeManager.dict[type.toString()] = new ChoiceAttributeHelper()
        break;
        case attributeTypes.ATTR_TYPE_TIMESPAN:
          AttributeManager.dict[type.toString()] = new TimeSpanAttributeHelper()
        break;
        case attributeTypes.ATTR_TYPE_TIME:
          AttributeManager.dict[type.toString()] = new TimePointAttributeHelper()
        break;
        case attributeTypes.ATTR_TYPE_LOCATION:
          AttributeManager.dict[type.toString()] = new LocationAttributeHelper()
        break;
      }

      const helper = AttributeManager.dict[type.toString()]
      return helper
    }
  }
}