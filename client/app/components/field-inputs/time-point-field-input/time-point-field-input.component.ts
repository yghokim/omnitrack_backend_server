import { Component, OnInit } from '@angular/core';
import { BaseItemFieldInputComponent } from '../base-item-field-input.component';
import { TimePoint } from '../../../../../omnitrack/core/datatypes/field_datatypes';
import * as moment from 'moment-timezone';
import TypedStringSerializer from '../../../../../omnitrack/core/typed_string_serializer';

@Component({
  selector: 'app-time-point-field-input',
  templateUrl: './time-point-field-input.component.html',
  styleUrls: ['./time-point-field-input.component.scss']
})
export class TimePointFieldInputComponent extends BaseItemFieldInputComponent implements OnInit {

  time: Date

  protected onNewValue(attributeType: number, serializedValue?: string, deserializedValue?: any) {
    if(deserializedValue){
    this.time = (deserializedValue as TimePoint).toDate()
    }
  }

  constructor() {
    super();
  }

  ngOnInit() {
  }

  onTimeChanged(event){
    const value = moment(event)
    if(value.isValid() === true){
      (this.deserializedValue as TimePoint).timestamp = value.toDate().getTime()
      this.setNewDeserializedValue(this.deserializedValue)
    }
  }

}
