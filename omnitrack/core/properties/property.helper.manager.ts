import { EPropertyType } from "./property.types";
import PropertyHelper from "./property.helper.base";
import RatingOptionsPropertyHelper from "./rating_options.property.helper";
import NumberStylePropertyHelper from "./number_style.property.helper";
import ChoiceEntryListPropertyHelper from "./choice-entry-list.property.helper";
import BooleanPropertyHelper from "./boolean.property.helper";
import SelectionPropertyHelper from './selection.property.helper';

export default class PropertyHelperManager {
  private static dict = {}

  static getHelper<T>(type: EPropertyType): PropertyHelper<T> {
    const helper = PropertyHelperManager.dict[type]
    if (helper instanceof PropertyHelper) {
      return helper
    } else {
      switch (type) {
        case EPropertyType.RatingOptions:
          PropertyHelperManager.dict[type] = new RatingOptionsPropertyHelper()
          break;
        case EPropertyType.NumberStyle:
          PropertyHelperManager.dict[type] = new NumberStylePropertyHelper()
          break;
        case EPropertyType.ChoiceEntryList:
          PropertyHelperManager.dict[type] = new ChoiceEntryListPropertyHelper()
          break;
        case EPropertyType.Boolean:
          PropertyHelperManager.dict[type] = new BooleanPropertyHelper()
          break;
        case EPropertyType.Selection:
          PropertyHelperManager.dict[type] = new SelectionPropertyHelper()
          break;
      }
      return PropertyHelperManager.dict[type]
    }
  }
}
