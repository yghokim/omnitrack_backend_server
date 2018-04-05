import { Component, OnInit } from '@angular/core';
import { BaseItemFieldInputComponent } from '../base-item-field-input.component';
import AttributeManager from '../../../../../omnitrack/core/attributes/attribute.manager';
import ChoiceAttributeHelper from '../../../../../omnitrack/core/attributes/choice.attribute.helper';

@Component({
  selector: 'app-choice-field-input',
  templateUrl: './choice-field-input.component.html',
  styleUrls: ['./choice-field-input.component.scss']
})
export class ChoiceFieldInputComponent extends BaseItemFieldInputComponent implements OnInit {



  protected onNewValue(attributeType: number, serializedValue?: string, deserializedValue?: any) {
    const helper: ChoiceAttributeHelper = AttributeManager.getHelper(attributeType) as any
    const entries = helper.getChoiceEntryList(this.attribute)
    const allowMultiSelection = helper.getAllowMultiSelection(this.attribute)
  }

  constructor() {
    super();
  }

  ngOnInit() {
  }

}
