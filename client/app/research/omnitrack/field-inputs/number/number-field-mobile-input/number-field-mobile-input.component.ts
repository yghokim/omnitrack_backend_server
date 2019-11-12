import { Component, OnInit } from '@angular/core';
import { NumberStyle } from '../../../../../../../omnitrack/core/datatypes/number_style';
import { FieldMobileInputComponentBase } from '../../field-mobile-input-base.component';
import { NumberFieldHelper } from '../../../../../../../omnitrack/core/fields/number.field.helper';

@Component({
  selector: 'app-number-field-mobile-input',
  templateUrl: './number-field-mobile-input.component.html',
  styleUrls: ['./number-field-mobile-input.component.scss']
})
export class NumberFieldMobileInputComponent extends FieldMobileInputComponentBase<NumberFieldHelper> implements OnInit {

  get numberStyle(): NumberStyle{
    return this.getFieldHelper().getParsedPropertyValue(this.field, NumberFieldHelper.PROPERTY_KEY_NUMBER_STYLE)
  }

  constructor() {
    super()
   }

  ngOnInit() {
  }

}
