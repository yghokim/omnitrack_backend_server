import FieldHelper from "./field.helper";
import TypedStringSerializer from "../typed_string_serializer";
import { IFieldDbEntity } from "../db-entity-types";
import PropertyHelper from "../properties/property.helper.base";
import FieldIconTypes from "./field-icon-types";
import fieldTypes from "./field-types";

export class LongTextFieldHelper extends FieldHelper{
    typeName = "Long Text"
    typeNameForSerialization = TypedStringSerializer.TYPENAME_STRING
    
    propertyKeys = [];

    constructor() {
        super(fieldTypes.ATTR_TYPE_LONG_TEXT)
    }

    getPropertyName(propertyKey: string): string{
      return "property"
    }
    
    getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
        return null
    }
    
    getSmallIconType(field: IFieldDbEntity): string {
        return FieldIconTypes.ATTR_ICON_SMALL_LONGTEXT
    }
    
    formatFieldValue(attr: IFieldDbEntity, value: any): string {
        return value
    }


}