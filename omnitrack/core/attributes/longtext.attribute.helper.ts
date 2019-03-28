import AttributeHelper from "./attribute.helper";
import TypedStringSerializer from "../typed_string_serializer";
import { IAttributeDbEntity } from "../db-entity-types";
import PropertyHelper from "../properties/property.helper.base";
import AttributeIconTypes from "./attribute-icon-types";
import attributeTypes from "./attribute-types";

export class LongTextAttributeHelper extends AttributeHelper{
    typeName = "Long Text"
    typeNameForSerialization = TypedStringSerializer.TYPENAME_STRING
    
    propertyKeys = [];

    constructor() {
        super(attributeTypes.ATTR_TYPE_LONG_TEXT)
    }
    
    getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
        return null
    }
    
    getSmallIconType(attribute: IAttributeDbEntity): string {
        return AttributeIconTypes.ATTR_ICON_SMALL_LONGTEXT
    }
    
    formatAttributeValue(attr: IAttributeDbEntity, value: any): string {
        return value
    }


}