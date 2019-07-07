import { Component, OnInit } from '@angular/core';
import { FieldMobileInputComponentBase } from '../../field-mobile-input-base.component';
import { TextFieldHelper } from '../../../../../../../omnitrack/core/fields/text.field.helper';

@Component({
  selector: 'app-text-field-mobile-input',
  templateUrl: './text-field-mobile-input.component.html',
  styleUrls: ['./text-field-mobile-input.component.scss']
})
export class TextFieldMobileInputComponent extends FieldMobileInputComponentBase<TextFieldHelper> implements OnInit {

  getInputType(): number {
    return this.getFieldHelper().getParsedPropertyValue(this.field, TextFieldHelper.PROPERTY_KEY_INPUT_TYPE)
  }

  constructor() {
    super()
  }

  ngOnInit() {
  }

}
