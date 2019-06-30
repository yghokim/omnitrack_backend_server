import { EPropertyType } from "./property.types";
import PropertyHelper from "./property.helper.base";
import { RatingOptions } from "../datatypes/rating_options";
import { NumberStyle } from "../datatypes/number_style";
import { UniqueStringEntryList } from "../datatypes/unique-string-entry-list";

export default class PropertyHelperManager {
  private static dict = {}

  static getHelper<T>(type: EPropertyType): PropertyHelper<T> {
    const helper = PropertyHelperManager.dict[type]
    if (helper instanceof PropertyHelper) {
      return helper
    } else {
      switch (type) {
        case EPropertyType.RatingOptions:
          PropertyHelperManager.dict[type] = new PropertyHelper<RatingOptions>()
          break;
        case EPropertyType.NumberStyle:
          PropertyHelperManager.dict[type] = new PropertyHelper<NumberStyle>()
          break;
        case EPropertyType.ChoiceEntryList:
          PropertyHelperManager.dict[type] = new PropertyHelper<UniqueStringEntryList>()
          break;
        case EPropertyType.Boolean:
          PropertyHelperManager.dict[type] = new PropertyHelper<boolean>()
          break;
        case EPropertyType.Selection:
          PropertyHelperManager.dict[type] = new PropertyHelper<number>()
          break;
        case EPropertyType.Number:
          PropertyHelperManager.dict[type] = new PropertyHelper<number>()
          break;
      }
      return PropertyHelperManager.dict[type]
    }
  }
}
