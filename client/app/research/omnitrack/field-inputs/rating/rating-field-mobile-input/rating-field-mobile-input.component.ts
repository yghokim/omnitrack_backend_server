import { Component, OnInit } from '@angular/core';
import { FieldMobileInputComponentBase } from '../../field-mobile-input-base.component';
import { RatingFieldHelper } from '../../../../../../../omnitrack/core/fields/rating.field.helper';
import { RatingOptions } from '../../../../../../../omnitrack/core/datatypes/rating_options';
import { DEFAULT_VALUE_POLICY_FILL_WITH_INTRINSIC_VALUE } from '../../../../../../../omnitrack/core/fields/fallback-policies';

@Component({
  selector: 'app-rating-field-mobile-input',
  templateUrl: './rating-field-mobile-input.component.html',
  styleUrls: ['./rating-field-mobile-input.component.scss']
})
export class RatingFieldMobileInputComponent extends FieldMobileInputComponentBase<RatingFieldHelper> implements OnInit {

  get options(): RatingOptions {
    return this.getFieldHelper().getParsedPropertyValue(this.field, RatingFieldHelper.PROPERTY_KEY_OPTIONS)
  }

  get isFallbackHalf(): boolean{
    return this.field.fallbackPolicy === DEFAULT_VALUE_POLICY_FILL_WITH_INTRINSIC_VALUE
  }

  constructor() {
    super()
   }

  ngOnInit() {
  }

}
