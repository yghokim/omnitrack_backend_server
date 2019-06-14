import AttributeHelper from "./attribute.helper";
import PropertyHelper from "../properties/property.helper.base";
import PropertyHelperManager from '../properties/property.helper.manager';
import { EPropertyType } from '../properties/property.types';
import { IAttributeDbEntity } from '../db-entity-types';
import { UniqueStringEntryList } from "../datatypes/unique-string-entry-list";
import attributeTypes from "./attribute-types";
import TypedStringSerializer from '../typed_string_serializer';
import AttributeIconTypes from "./attribute-icon-types";

export class ChoiceAttributeHelper extends AttributeHelper {
  static readonly PROPERTY_MULTISELECTION = "multiSelection"
  static readonly PROPERTY_ENTRIES = "entries"
  static readonly PROPERTY_ALLOW_APPENDING_FROM_VIEW = "allowAppendingFromView"

  get typeName(): string { return "Choice" }

  get typeNameForSerialization(): string { return TypedStringSerializer.TYPENAME_INT_ARRAY }

  formatAttributeValue(attr: IAttributeDbEntity, value: any): string {
    if (value instanceof Array) {
      const entryList = this.getParsedPropertyValue<UniqueStringEntryList>(attr, ChoiceAttributeHelper.PROPERTY_ENTRIES)
      if (entryList) {
        return value.map(id => {
          const entry = entryList.entries.find(entry => entry.id === id)
          if (entry) {
            return entry.val
          } else return "[Removed Entry]"
        }).join(", ")
      }
    }

    return value.toString()
  }

  propertyKeys = [
    ChoiceAttributeHelper.PROPERTY_MULTISELECTION,
    ChoiceAttributeHelper.PROPERTY_ALLOW_APPENDING_FROM_VIEW,
    ChoiceAttributeHelper.PROPERTY_ENTRIES
  ]

  constructor() {
    super(attributeTypes.ATTR_TYPE_CHOICE)
  }

  getPropertyName(propertyKey: string): string {
    switch (propertyKey) {
      case ChoiceAttributeHelper.PROPERTY_MULTISELECTION:
        return "Multiselection"
      case ChoiceAttributeHelper.PROPERTY_ENTRIES:
        return "Entries"
      case ChoiceAttributeHelper.PROPERTY_ALLOW_APPENDING_FROM_VIEW:
        return "Allow Adding Entries in Form"
    }
  }

  getPropertyDefaultValue(propertyKey: string): any{
    switch (propertyKey) {
      case ChoiceAttributeHelper.PROPERTY_MULTISELECTION:
        return false
      case ChoiceAttributeHelper.PROPERTY_ENTRIES:
        return new UniqueStringEntryList()
      case ChoiceAttributeHelper.PROPERTY_ALLOW_APPENDING_FROM_VIEW:
        return false
    }
  }

  getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
    switch (propertyKey) {
      case ChoiceAttributeHelper.PROPERTY_MULTISELECTION:
        return PropertyHelperManager.getHelper(EPropertyType.Boolean)
      case ChoiceAttributeHelper.PROPERTY_ENTRIES:
        return PropertyHelperManager.getHelper(EPropertyType.ChoiceEntryList)
      case ChoiceAttributeHelper.PROPERTY_ALLOW_APPENDING_FROM_VIEW:
        return PropertyHelperManager.getHelper(EPropertyType.Boolean)
    }
  }

  getChoiceEntryList(attribute: IAttributeDbEntity): UniqueStringEntryList {
    return this.getParsedPropertyValue<UniqueStringEntryList>(attribute, ChoiceAttributeHelper.PROPERTY_ENTRIES)
  }

  getAllowMultiSelection(attribute: IAttributeDbEntity): boolean {
    return this.getParsedPropertyValue<boolean>(attribute, ChoiceAttributeHelper.PROPERTY_MULTISELECTION)
  }


  getSmallIconType(attribute: IAttributeDbEntity): string {
    if (this.getAllowMultiSelection(attribute) == true) {
      return AttributeIconTypes.ATTR_ICON_SMALL_MULTIPLE_CHOICE
    } else return AttributeIconTypes.ATTR_ICON_SMALL_SINGLE_CHOICE
  }
}