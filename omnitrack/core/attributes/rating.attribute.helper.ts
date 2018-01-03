import AttributeHelper from "./attribute.helper";
import PropertyHelperManager from "../properties/property.helper.manager";
import { EPropertyType } from "../properties/property.types";
import PropertyHelper from "../properties/property.helper.base";
import AttributeManager from "./attribute.manager";

export default class RatingAttributeHelper extends AttributeHelper {

  constructor() {
    super(AttributeManager.ATTR_TYPE_RATING)
  }

  static readonly PROPERTY_KEY_OPTIONS = "options"

  propertyKeys: string[] = [RatingAttributeHelper.PROPERTY_KEY_OPTIONS];

  getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
    switch (propertyKey) {
      case RatingAttributeHelper.PROPERTY_KEY_OPTIONS:
      return PropertyHelperManager.getHelper(EPropertyType.RatingOptions)
    }
  }


}