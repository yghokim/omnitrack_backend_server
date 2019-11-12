import { Component, OnInit } from '@angular/core';
import { FieldMobileInputComponentBase } from '../../field-mobile-input-base.component';
import { ChoiceFieldHelper } from '../../../../../../../omnitrack/core/fields/choice.field.helper';
import { IFieldDbEntity } from '../../../../../../../omnitrack/core/db-entity-types';
import { DEFAULT_VALUE_POLICY_FILL_WITH_INTRINSIC_VALUE } from '../../../../../../../omnitrack/core/fields/fallback-policies';

@Component({
  selector: 'app-choice-field-mobile-input',
  templateUrl: './choice-field-mobile-input.component.html',
  styleUrls: ['./choice-field-mobile-input.component.scss']
})
export class ChoiceFieldMobileInputComponent extends FieldMobileInputComponentBase<ChoiceFieldHelper> implements OnInit {

  constructor() {
    super()
  }

  ngOnInit() {
  }

}
