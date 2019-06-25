import PropertyHelper from "./property.helper.base";
import { UniqueStringEntryList } from '../datatypes/unique-string-entry-list';
import { EPropertyType } from "./property.types";

export default class ChoiceEntryListPropertyHelper extends PropertyHelper<UniqueStringEntryList> {

  type = EPropertyType.ChoiceEntryList

  deserializePropertyValue(serialized: string): UniqueStringEntryList {
    const parsed = JSON.parse(serialized) as UniqueStringEntryList
    return parsed
  }
  serializePropertyValue(propertyValue: UniqueStringEntryList): string {
    return JSON.stringify(propertyValue)
  }

}
