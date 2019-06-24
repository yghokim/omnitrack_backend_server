import FieldHelper from "./field.helper";
import PropertyHelper from "../properties/property.helper.base";
import { IFieldDbEntity } from "../db-entity-types";
import fieldTypes from "./field-types";
import TypedStringSerializer from "../typed_string_serializer";
import FieldIconTypes from "./field-icon-types";
import { ServerFile } from "../datatypes/field_datatypes";

export class ImageFieldHelper extends FieldHelper{
    typeName: string = "Image";    
    typeNameForSerialization: string = TypedStringSerializer.TYPENAME_SERVERFILE; 
    propertyKeys: string[] = []

    constructor(){
        super(fieldTypes.ATTR_TYPE_IMAGE)
    }

    getPropertyName(propertyKey: string): string{
      return "property"
    }

    getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
        return null
    }
    getSmallIconType(field: IFieldDbEntity): string {
        return FieldIconTypes.ATTR_ICON_SMALL_IMAGE
    }

    formatFieldValue(attr: IFieldDbEntity, value: any): string {
        const imageFile = value as ServerFile
        return imageFile.mimeType
    }


}