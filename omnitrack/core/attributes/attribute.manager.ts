import AttributeHelper from "./attribute.helper";
import RatingAttributeHelper from "./rating.attribute.helper";

export default class AttributeManager {

  static readonly ATTR_TYPE_NUMBER = 0
  static readonly ATTR_TYPE_TIME = 1
  static readonly ATTR_TYPE_TIMESPAN = 2
  static readonly ATTR_TYPE_SHORT_TEXT = 3
  static readonly ATTR_TYPE_LONG_TEXT = 4
  static readonly ATTR_TYPE_LOCATION = 5
  static readonly ATTR_TYPE_CHOICE = 6
  static readonly ATTR_TYPE_RATING = 7
  static readonly ATTR_TYPE_IMAGE = 8
  static readonly ATTR_TYPE_AUDIO = 9

  private static dict = {}

  static getHelper(type: number): AttributeHelper {
    const helper = AttributeManager.dict[type.toString()]
    if (helper instanceof AttributeHelper) {
      return helper
    } else {
      switch (type) {
        case AttributeManager.ATTR_TYPE_RATING:
          AttributeManager.dict[type.toString()] = new RatingAttributeHelper()
          break
      }

      return AttributeManager.dict[type.toString()]
    }
  }
}