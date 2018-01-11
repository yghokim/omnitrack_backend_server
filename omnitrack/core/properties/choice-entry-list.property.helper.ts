import PropertyHelper from "./property.helper.base";
import { UniqueStringEntryList } from '../datatypes/unique-string-entry-list';

export default class ChoiceEntryListPropertyHelper extends PropertyHelper<UniqueStringEntryList> {

  deserializePropertyValue(serialized: string): UniqueStringEntryList {
    const parsed = JSON.parse(serialized) as UniqueStringEntryList
    return parsed
  }
  serializePropertyValue(propertyValue: UniqueStringEntryList): string {
    return JSON.stringify(propertyValue)
  }

}
