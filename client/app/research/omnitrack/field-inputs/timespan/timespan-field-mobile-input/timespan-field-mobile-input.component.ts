import { Component, OnInit, AfterContentInit, AfterContentChecked } from '@angular/core';
import * as moment from 'moment';
import { FieldMobileInputComponentBase } from '../../field-mobile-input-base.component';
import { TimeSpanFieldHelper } from '../../../../../../../omnitrack/core/fields/time-span.field.helper';

@Component({
  selector: 'app-timespan-field-mobile-input',
  templateUrl: './timespan-field-mobile-input.component.html',
  styleUrls: ['./timespan-field-mobile-input.component.scss']
})
export class TimeSpanFieldMobileInputComponent extends FieldMobileInputComponentBase<TimeSpanFieldHelper> implements OnInit, AfterContentChecked {

  current = moment(Date.now())
  dateButtonFormat = 'LL'

  footerButtonInfos = ["", "", ""]

  constructor() {
    super()
  }

  ngOnInit() {
  }

  ngAfterContentChecked() {
    switch (this.getFieldHelper().getParsedPropertyValue(this.field, TimeSpanFieldHelper.PROPERTY_GRANULARITY)) {
      case TimeSpanFieldHelper.GRANULARITY_DAY:
        this.dateButtonFormat = 'MMM D, ddd, YYYY'
        this.footerButtonInfos = ["+ 1 day", "+ 1 week", "To now"]
        break;
      case TimeSpanFieldHelper.GRANULARITY_MINUTE:
        this.dateButtonFormat = 'hh:mm A, MMM D, YYYY'
        this.footerButtonInfos = ["+ 30 mins", "+ 1 hour", "To now"]
        break;
    }
  }

}
