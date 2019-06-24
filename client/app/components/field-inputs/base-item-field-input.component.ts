import { Input, Output, EventEmitter } from '@angular/core';
import { IItemDbEntity, ITrackerDbEntity, IFieldDbEntity } from '../../../../omnitrack/core/db-entity-types';
import FieldManager from '../../../../omnitrack/core/fields/field.manager';
import TypedStringSerializer from '../../../../omnitrack/core/typed_string_serializer';
import * as moment from 'moment-timezone';
import { TimePoint } from '../../../../omnitrack/core/datatypes/field_datatypes';

export abstract class BaseItemFieldInputComponent {
  tracker: ITrackerDbEntity
  field: IFieldDbEntity
  item: IItemDbEntity

  _serializedValue: string
  _deserializedValue: any

  public get serializedValue(): string { return this._serializedValue }
  public get deserializedValue(): any { return this._deserializedValue }

  @Output() serializedValueChanged: EventEmitter<string> = new EventEmitter<string>()

  @Input("info") set _info(info: { tracker: ITrackerDbEntity, field: IFieldDbEntity, item: IItemDbEntity }) {
    this.tracker = info.tracker
    this.field = info.field
    this.item = info.item

    const entry = this.item.dataTable.find(d => d.fieldLocalId === this.field.localId)
    if (entry) {
      const helper = FieldManager.getHelper(this.field.type);
      if (helper) {
        const deserializedValue = TypedStringSerializer.deserialize(
          entry.sVal
        );
        this._serializedValue = entry.sVal
        this._deserializedValue = deserializedValue
        this.onNewValue(this.field.type, entry.sVal, deserializedValue)
      } else {
        console.log("unsupported field")
      }
    }
    else if(this.field.name === "Logged At"){
      let timeEntry: TimePoint = new TimePoint(this.item.timestamp, this.item.timezone);
      this._serializedValue = TypedStringSerializer.serialize( "T",timeEntry);
      this._deserializedValue = TypedStringSerializer.deserialize(this._serializedValue);
      this.onNewValue(this.field.type, this._serializedValue, this._deserializedValue)
    }
    else {
      this._serializedValue = null
      this._deserializedValue = null
      this.onNewValue(this.field.type)
    }

    this.onInformationSet(info)
  }

  protected onInformationSet(info: { tracker: ITrackerDbEntity, field: IFieldDbEntity, item: IItemDbEntity }) {

  }

  protected setNewSerializedValue(serialized: string){
    this._serializedValue = serialized
    this._deserializedValue = TypedStringSerializer.deserialize(serialized)
    this.serializedValueChanged.emit(this._serializedValue)
  }

  protected setNewDeserializedValue(value: any){
    this._deserializedValue = value
    this._serializedValue = TypedStringSerializer.serialize(FieldManager.getHelper(this.field.type).typeNameForSerialization, value)
    this.serializedValueChanged.emit(this._serializedValue)
  }

  protected abstract onNewValue(fieldType: number, serializedValue?: string, deserializedValue?: any)

}