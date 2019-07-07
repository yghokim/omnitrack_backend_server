import { Component, OnInit } from '@angular/core';
import { FieldMobileInputComponentBase } from '../../field-mobile-input-base.component';
import { TimePointFieldHelper } from '../../../../../../../omnitrack/core/fields/time-point.field.helper';

@Component({
  selector: 'app-time-field-mobile-input',
  templateUrl: './time-field-mobile-input.component.html',
  styleUrls: ['./time-field-mobile-input.component.scss']
})
export class TimeFieldMobileInputComponent extends FieldMobileInputComponentBase<TimePointFieldHelper> implements OnInit {

  constructor() {
    super()
   }

  ngOnInit() {
  }

}
