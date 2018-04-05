import AttributeHelper from "./attribute.helper";
import AttributeManager from "./attribute.manager";
import PropertyHelper from "../properties/property.helper.base";
import PropertyHelperManager from '../properties/property.helper.manager';
import { EPropertyType } from '../properties/property.types';
import { IAttributeDbEntity } from '../db-entity-types';
import ChoiceEntryListPropertyHelper from "../properties/choice-entry-list.property.helper";
import { UniqueStringEntryList } from "../datatypes/unique-string-entry-list";
import attributeTypes from "./attribute-types";
import TypedStringSerializer from '../typed_string_serializer';

export default class ChoiceAttributeHelper extends AttributeHelper {
  static readonly PROPERTY_MULTISELECTION = "multiSelection"
  static readonly PROPERTY_ENTRIES = "entries"
  
  get typeName(): string{return "Choice"}

  get typeNameForSerialization(): string{return TypedStringSerializer.TYPENAME_INT_ARRAY}

  formatAttributeValue(attr: IAttributeDbEntity, value: any): string {
    if(value instanceof Array)
    {   
      const entryList = this.getParsedPropertyValue<UniqueStringEntryList>(attr, ChoiceAttributeHelper.PROPERTY_ENTRIES)
      if(entryList)
      {
        return value.map(id => {
          const entry = entryList.entries.find(entry=>entry.id === id)
          if(entry){
            return entry.val
          }else return "[Removed Entry]"
        }).join(", ")
      }
    }
    
    return value.toString()
  }

  propertyKeys = [ChoiceAttributeHelper.PROPERTY_ENTRIES, ChoiceAttributeHelper.PROPERTY_MULTISELECTION]

  constructor() {
    super(attributeTypes.ATTR_TYPE_CHOICE)
  }

  getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
    switch (propertyKey) {
      case ChoiceAttributeHelper.PROPERTY_MULTISELECTION:
        return PropertyHelperManager.getHelper(EPropertyType.Boolean)
      case ChoiceAttributeHelper.PROPERTY_ENTRIES:
        return PropertyHelperManager.getHelper(EPropertyType.ChoiceEntryList)
    }
  }

  getChoiceEntryList(attribute: IAttributeDbEntity): UniqueStringEntryList{
    return this.getParsedPropertyValue<UniqueStringEntryList>(attribute, ChoiceAttributeHelper.PROPERTY_ENTRIES)
  }

  getAllowMultiSelection(attribute: IAttributeDbEntity): boolean{
    return this.getParsedPropertyValue<boolean>(attribute, ChoiceAttributeHelper.PROPERTY_MULTISELECTION)
  }

}