import FieldHelper from "./field.helper";
import PropertyHelper from "../properties/property.helper.base";
import { IFieldDbEntity } from "../db-entity-types";
import fieldTypes from "./field-types";
import TypedStringSerializer from "../typed_string_serializer";
import FieldIconTypes from "./field-icon-types";
import { ServerFile } from "../datatypes/field_datatypes";
import { EPropertyType } from "../properties/property.types";

export class AudioRecordFieldHelper extends FieldHelper {
  typeName = "Audio Record";
  typeNameForSerialization: string = TypedStringSerializer.TYPENAME_SERVERFILE;
  propertyKeys: string[] = []

  constructor() {
    super(fieldTypes.ATTR_TYPE_AUDIO)
  }

  getPropertyHelper<T>(propertyKey: string): PropertyHelper<T> {
    return null
  }

  getPropertyType(propertyKey: string): EPropertyType {
    return null
  }

  getSmallIconType(field: IFieldDbEntity): string {
    return FieldIconTypes.ATTR_ICON_SMALL_AUDIO
  }

  formatFieldValue(attr: IFieldDbEntity, value: any): string {
    const imageFile = value as ServerFile
    let injectionId: string
    if (attr.flags) {
      injectionId = attr.flags.injectionId
    }
    if (injectionId != null) {
      return injectionId
    } else { return attr.localId }
  }

  getPropertyName(propertyKey: string): string {
    return "property"
  }


}
