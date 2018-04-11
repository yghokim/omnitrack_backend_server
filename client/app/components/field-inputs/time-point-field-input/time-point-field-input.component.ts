import { Component, OnInit } from '@angular/core';
import { BaseItemFieldInputComponent } from '../base-item-field-input.component';
import { TimePoint } from '../../../../../omnitrack/core/datatypes/field_datatypes';
import * as moment from 'moment-timezone';
import TypedStringSerializer from '../../../../../omnitrack/core/typed_string_serializer';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-time-point-field-input',
  templateUrl: './time-point-field-input.component.html',
  styleUrls: ['./time-point-field-input.component.scss']
})
export class TimePointFieldInputComponent extends BaseItemFieldInputComponent implements OnInit {

  date: Date
  hours: Array<number> = [];
  minutes: Array<number> = [];
 
  protected onNewValue(attributeType: number, serializedValue?: string, deserializedValue?: any) {
    if(deserializedValue){
    this.date = (deserializedValue as TimePoint).toDate()
    }
    for (let i: number = 0; i < 25; i++) { this.hours[i] = i; }
    for (let i: number = 0; i < 60; i++) { this.minutes[i] = i; }
  }

  constructor() {
    super();
  }

  ngOnInit() {
  }

  onDateChanged(event){
    this.date = event.value;
    const value = moment(event.value)
    this.updateDateTime(value);
  }

  onTimeChanged(time: number, event){
    if(time === 1){
      this.date.setHours(event.value);
    }
    else{
      this.date.setMinutes(event.value);
    }
    this.updateDateTime(moment(this.date));
  }

  updateDateTime(value: moment.Moment){
    if(value.isValid() === true){
      (this.deserializedValue as TimePoint).timestamp = value.toDate().getTime()
      this.setNewDeserializedValue(this.deserializedValue)
    }
  }


}
