import { Component, OnInit } from '@angular/core';
import { BaseItemFieldInputComponent } from '../base-item-field-input.component';
import AttributeManager from '../../../../../omnitrack/core/attributes/attribute.manager';
import ChoiceAttributeHelper from '../../../../../omnitrack/core/attributes/choice.attribute.helper';
import { UniqueStringEntryList } from '../../../../../omnitrack/core/datatypes/unique-string-entry-list';
import { forEach } from '@angular/router/src/utils/collection';
import { MatCheckboxChange } from '@angular/material';

@Component({
  selector: 'app-choice-field-input',
  templateUrl: './choice-field-input.component.html',
  styleUrls: ['./choice-field-input.component.scss']
})
export class ChoiceFieldInputComponent extends BaseItemFieldInputComponent implements OnInit {

  isMultiSelection: Boolean;
  entries: Array<any>;
  checkBoxes: Array<Boolean> = [];
  result: Array<number> = [];
  radioSelect: number;


  protected onNewValue(attributeType: number, serializedValue?: string, deserializedValue?: any) {
    const helper: ChoiceAttributeHelper = AttributeManager.getHelper(attributeType) as any
    const entries = helper.getChoiceEntryList(this.attribute)
    const allowMultiSelection = helper.getAllowMultiSelection(this.attribute)
    this.entries = helper.getChoiceEntryList(this.attribute).entries;
    console.log(this.entries);
    this.isMultiSelection = helper.getAllowMultiSelection(this.attribute);
    for (let i in this.entries){
      this.checkBoxes[i] = false;
    }
  }

  constructor() {
    super();
  }

  ngOnInit() {
  }

  onValueChanged(value: number){
    let helper: Array<number> = [value];
    this.setNewDeserializedValue(helper);
  }

  onSelected(value: MatCheckboxChange){
    if(value.checked === true){
     this.result.push(+value.source.value);
     this.setNewDeserializedValue(this.result);
    }
  }


}
