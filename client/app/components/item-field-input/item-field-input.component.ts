import { Component, OnInit } from '@angular/core';
import { BaseItemFieldInputComponent } from '../field-inputs/base-item-field-input.component';
import AttributeManager from '../../../../omnitrack/core/attributes/attribute.manager';
import attributeTypes from '../../../../omnitrack/core/attributes/attribute-types';

@Component({
  selector: 'app-item-field-input',
  templateUrl: './item-field-input.component.html',
  styleUrls: ['./item-field-input.component.scss']
})
export class ItemFieldInputComponent extends BaseItemFieldInputComponent implements OnInit {

  info: any

  inputType: string = null

  protected onNewValue(attributeType: number, serializedValue?: string, deserializedValue?: any) {
    if(attributeType === attributeTypes.ATTR_TYPE_TIME){
      this.inputType = "timepoint"
    }else if(attributeType === attributeTypes.ATTR_TYPE_CHOICE){
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
