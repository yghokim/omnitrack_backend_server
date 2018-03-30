import { Input, Output, EventEmitter } from '@angular/core';
import { IItemDbEntity, ITrackerDbEntity, IAttributeDbEntity } from '../../../../omnitrack/core/db-entity-types';
import AttributeManager from '../../../../omnitrack/core/attributes/attribute.manager';
import TypedStringSerializer from '../../../../omnitrack/core/typed_string_serializer';

export abstract class BaseItemFieldInputComponent {
  tracker: ITrackerDbEntity
  attribute: IAttributeDbEntity
  item: IItemDbEntity

  serializedValue: string
  deserializedValue: any

  @Output() serializedValueChanged: EventEmitter<string> = new EventEmitter<string>()

  @Input("info") set _info(info: { tracker: ITrackerDbEntity, attribute: IAttributeDbEntity, item: IItemDbEntity }) {
    this.tracker = info.tracker
    this.attribute = info.attribute
    this.item = info.item

    const entry = this.item.dataTable.find(d => d.attrLocalId === this.attribute.localId)
    if (entry) {
      const helper = AttributeManager.getHelper(this.attribute.type);
      if (helper) {
        const deserializedValue = TypedStringSerializer.deserialize(
          entry.sVal
        );

        this.serializedValue = entry.sVal
        this.deserializedValue = deserializedValue
        this.onNewValue(this.attribute.type, entry.sVal, deserializedValue)
      } else {
        console.log("unsupported attribute")
      }
    }
    else {

      this.serializedValue = null
      this.deserializedValue = null
      this.onNewValue(this.attribute.type)
    }

    this.onInformationSet(info)
  }

  protected onInformationSet(info: { tracker: ITrackerDbEntity, attribute: IAttributeDbEntity, item: IItemDbEntity }) {

  }

  protected abstract onNewValue(attributeType: number, serializedValue?: string, deserializedValue?: any)

}