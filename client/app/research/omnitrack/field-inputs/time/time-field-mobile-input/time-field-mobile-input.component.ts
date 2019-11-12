import { Component, OnInit, AfterContentChecked } from '@angular/core';
import { FieldMobileInputComponentBase } from '../../field-mobile-input-base.component';
import { TimePointFieldHelper } from '../../../../../../../omnitrack/core/fields/time-point.field.helper';
import * as moment from 'moment';

@Component({
  selector: 'app-time-field-mobile-input',
  templateUrl: './time-field-mobile-input.component.html',
  styleUrls: ['./time-field-mobile-input.component.scss']
})
export class TimeFieldMobileInputComponent extends FieldMobileInputComponentBase<TimePointFieldHelper> implements OnInit, AfterContentChecked {

  current = moment(Date.now())

  showDateButton = false
  dialValues: [string, string, string] = ["0", "0", "0"]

  constructor() {
    super()
  }

  ngOnInit() {
  }

  ngAfterContentChecked() {
    switch (this.getFieldHelper().getParsedPropertyValue(this.field, TimePointFieldHelper.PROPERTY_GRANULARITY)) {
      case TimePointFieldHelper.GRANULARITY_DAY:
        this.showDateButton = false
        this.dialValues = [
          this.current.format('YYYY'),
          this.current.format('MMM'),
          this.current.format('DD').toUpperCase(),
        ]
        break;

      case TimePointFieldHelper.GRANULARITY_MINUTE:
        this.showDateButton = true
        this.dialValues = [
          this.current.format('hh'),
          this.current.format('mm'),
          this.current.format('A').toUpperCase(),
        ]
        break;

      case TimePointFieldHelper.GRANULARITY_SECOND:
        this.showDateButton = true
        this.dialValues = [
          this.current.format('A') + " " + this.current.format('HH'),
          this.current.format('mm'),
          this.current.format('ss'),
        ]
        break;
    }
  }
}
