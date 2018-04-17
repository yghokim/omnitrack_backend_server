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

  moment: moment.Moment;
  hours: Array<number> = [];
  minutes: Array<number> = [];
  currentZone: String;
  timezones: Array<String>;
 
  protected onNewValue(attributeType: number, serializedValue?: string, deserializedValue?: any) {
    if(deserializedValue){
    this.moment = (deserializedValue as TimePoint).toMoment();
    this.currentZone = this.moment.tz();
    this.timezones = moment.tz.names();
    console.log(this.currentZone);
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
    this.moment = moment(event.value)
    this.updateDateTime(this.moment);
  }

  onTimeChanged(time: number, event){
    if(time === 1){
      this.moment.hour(event.value)   
    }
    else{
      this.moment.minutes(event.value);
    }
    this.updateDateTime(this.moment);
  }

  onTimeZoneChanged(zone: string){
    this.moment.tz(zone);
    (this.deserializedValue as TimePoint).timezone = this.moment.tz();
    this.setNewDeserializedValue(this.deserializedValue)
  }

  updateDateTime(value: moment.Moment){
    if(value.isValid() === true){
      (this.deserializedValue as TimePoint).timestamp = value.toDate().getTime();
      this.setNewDeserializedValue(this.deserializedValue)
    }
  }


}
