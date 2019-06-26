import FieldHelper from "./field.helper";
import TypedStringSerializer from "../typed_string_serializer";
import { IFieldDbEntity } from "../db-entity-types";
import PropertyHelper from "../properties/property.helper.base";
import FieldIconTypes from "./field-icon-types";
import fieldTypes from "./field-types";
import PropertyHelperManager from "../properties/property.helper.manager";
import { EPropertyType } from "../properties/property.types";

export class TextFieldHelper extends FieldHelper {
  typeName = "Text"
  typeNameForSerialization = TypedStringSerializer.TYPENAME_STRING


  static readonly PROPERTY_KEY_INPUT_TYPE = "type"

  static readonly INPUT_TYPE_SHORT = 0
  static readonly INPUT_TYPE_LONG = 1

  propertyKeys = [TextFieldHelper.PROPERTY_KEY_INPUT_TYPE]

  constructor() {
    super(fieldTypes.ATTR_TYPE_TEXT)
  }

  getPropertyName(propertyKey: string): string {
    switch (propertyKey) {
      case TextFieldHelper.PROPERTY_KEY_INPUT_TYPE:
        return "Input Type"
    }
  }

  getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
    switch (propertyKey) {
      case TextFieldHelper.PROPERTY_KEY_INPUT_TYPE:
        return PropertyHelperManager.getHelper(EPropertyType.Selection)
    }
  }

  getPropertyDefaultValue(propertyKey: string): any {
    switch (propertyKey) {
      case TextFieldHelper.PROPERTY_KEY_INPUT_TYPE: return TextFieldHelper.INPUT_TYPE_SHORT
    }
  }

  getPropertyConfig(propertyKey: string): any {
    switch (propertyKey) {
      case TextFieldHelper.PROPERTY_KEY_INPUT_TYPE:
        return {
          list: [
            { id: TextFieldHelper.INPUT_TYPE_SHORT, name: "Short text" },
            { id: TextFieldHelper.INPUT_TYPE_LONG, name: "Long text" }]
        }
    }
  }
  
  getSmallIconType(field: IFieldDbEntity): string {
    switch (this.getParsedPropertyValue(field, TextFieldHelper.PROPERTY_KEY_INPUT_TYPE)) {
      case TextFieldHelper.INPUT_TYPE_SHORT:
        return FieldIconTypes.ATTR_ICON_SMALL_SHORTTEXT
      case TextFieldHelper.INPUT_TYPE_LONG:
        return FieldIconTypes.ATTR_ICON_SMALL_LONGTEXT
    }
  }

  formatFieldValue(attr: IFieldDbEntity, value: any): string {
    return value
  }


}