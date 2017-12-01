import AttributeHelper from "./attribute.helper";
import AttributeManager from "./attribute.manager";
import PropertyHelper from "../properties/property.helper.base";
import PropertyHelperManager from "../properties/property.helper.manager";
import { EPropertyType } from "../properties/property.types";

export default class NumberAttributeHelper extends AttributeHelper{
  
  static readonly PROPERTY_KEY_NUMBER_STYLE = "style"
  
  propertyKeys = [NumberAttributeHelper.PROPERTY_KEY_NUMBER_STYLE]

  constructor(){
    super(AttributeManager.ATTR_TYPE_NUMBER)
  }

  getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
    switch(propertyKey)
    {
      case NumberAttributeHelper.PROPERTY_KEY_NUMBER_STYLE:
        return PropertyHelperManager.getHelper(EPropertyType.NumberStyle)
    }
  }
  
}