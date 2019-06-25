import { Component, OnInit } from '@angular/core';
import { BaseItemFieldInputComponent } from '../field-inputs/base-item-field-input.component';
import FieldManager from '../../../../omnitrack/core/fields/field.manager';
import fieldTypes from '../../../../omnitrack/core/fields/field-types';

@Component({
  selector: 'app-item-field-input',
  templateUrl: './item-field-input.component.html',
  styleUrls: ['./item-field-input.component.scss']
})
export class ItemFieldInputComponent extends BaseItemFieldInputComponent implements OnInit {

  info: any

  inputType: string = null

  protected onNewValue(fieldType: number, serializedValue?: string, deserializedValue?: any) {
    if(fieldType === fieldTypes.ATTR_TYPE_TIME){
      this.inputType = "timepoint"
    }else if(fieldType === fieldTypes.ATTR_TYPE_CHOICE){
      this.inputType = "choice"
    }
  }

  onInformationSet(info){
    this.info = info
  }

  constructor() {
    super();
  }

  ngOnInit() {
  }

}
