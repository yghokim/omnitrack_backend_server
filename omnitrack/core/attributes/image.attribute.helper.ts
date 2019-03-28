import AttributeHelper from "./attribute.helper";
import PropertyHelper from "../properties/property.helper.base";
import { IAttributeDbEntity } from "../db-entity-types";
import attributeTypes from "./attribute-types";
import TypedStringSerializer from "../typed_string_serializer";
import AttributeIconTypes from "./attribute-icon-types";
import { ServerFile } from "../datatypes/field_datatypes";

export class ImageAttributeHelper extends AttributeHelper{
    typeName: string = "Image";    
    typeNameForSerialization: string = TypedStringSerializer.TYPENAME_SERVERFILE; 
    propertyKeys: string[] = []

    constructor(){
        super(attributeTypes.ATTR_TYPE_IMAGE)
    }

    getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
        return null
    }
    getSmallIconType(attribute: IAttributeDbEntity): string {
        return AttributeIconTypes.ATTR_ICON_SMALL_IMAGE
    }

    formatAttributeValue(attr: IAttributeDbEntity, value: any): string {
        const imageFile = value as ServerFile
        return imageFile.mimeType
    }


}