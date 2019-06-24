import FieldHelper from "./field.helper";
import PropertyHelper from "../properties/property.helper.base";
import PropertyHelperManager from '../properties/property.helper.manager';
import { EPropertyType } from '../properties/property.types';
import { IFieldDbEntity } from '../db-entity-types';
import { UniqueStringEntryList } from "../datatypes/unique-string-entry-list";
import fieldTypes from "./field-types";
import TypedStringSerializer from '../typed_string_serializer';
import FieldIconTypes from "./field-icon-types";

export class ChoiceFieldHelper extends FieldHelper {
  static readonly PROPERTY_MULTISELECTION = "multiSelection"
  static readonly PROPERTY_ENTRIES = "entries"
  static readonly PROPERTY_ALLOW_APPENDING_FROM_VIEW = "allowAppendingFromView"

  get typeName(): string { return "Choice" }

  get typeNameForSerialization(): string { return TypedStringSerializer.TYPENAME_INT_ARRAY }

  formatFieldValue(attr: IFieldDbEntity, value: any): string {
    if (value instanceof Array) {
      const entryList = this.getParsedPropertyValue<UniqueStringEntryList>(attr, ChoiceFieldHelper.PROPERTY_ENTRIES)
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
    ChoiceFieldHelper.PROPERTY_MULTISELECTION,
    ChoiceFieldHelper.PROPERTY_ALLOW_APPENDING_FROM_VIEW,
    ChoiceFieldHelper.PROPERTY_ENTRIES
  ]

  constructor() {
    super(fieldTypes.ATTR_TYPE_CHOICE)
  }

  getPropertyName(propertyKey: string): string {
    switch (propertyKey) {
      case ChoiceFieldHelper.PROPERTY_MULTISELECTION:
        return "Multiselection"
      case ChoiceFieldHelper.PROPERTY_ENTRIES:
        return "Entries"
      case ChoiceFieldHelper.PROPERTY_ALLOW_APPENDING_FROM_VIEW:
        return "Allow Adding Entries in Form"
    }
  }

  getPropertyDefaultValue(propertyKey: string): any{
    switch (propertyKey) {
      case ChoiceFieldHelper.PROPERTY_MULTISELECTION:
        return false
      case ChoiceFieldHelper.PROPERTY_ENTRIES:
        return new UniqueStringEntryList()
      case ChoiceFieldHelper.PROPERTY_ALLOW_APPENDING_FROM_VIEW:
        return false
    }
  }

  getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
    switch (propertyKey) {
      case ChoiceFieldHelper.PROPERTY_MULTISELECTION:
        return PropertyHelperManager.getHelper(EPropertyType.Boolean)
      case ChoiceFieldHelper.PROPERTY_ENTRIES:
        return PropertyHelperManager.getHelper(EPropertyType.ChoiceEntryList)
      case ChoiceFieldHelper.PROPERTY_ALLOW_APPENDING_FROM_VIEW:
        return PropertyHelperManager.getHelper(EPropertyType.Boolean)
    }
  }

  getChoiceEntryList(field: IFieldDbEntity): UniqueStringEntryList {
    return this.getParsedPropertyValue<UniqueStringEntryList>(field, ChoiceFieldHelper.PROPERTY_ENTRIES)
  }

  getAllowMultiSelection(field: IFieldDbEntity): boolean {
    return this.getParsedPropertyValue<boolean>(field, ChoiceFieldHelper.PROPERTY_MULTISELECTION)
  }


  getSmallIconType(field: IFieldDbEntity): string {
    if (this.getAllowMultiSelection(field) == true) {
      return FieldIconTypes.ATTR_ICON_SMALL_MULTIPLE_CHOICE
    } else return FieldIconTypes.ATTR_ICON_SMALL_SINGLE_CHOICE
  }
}