import { Component, OnInit } from '@angular/core';
import { BaseItemFieldInputComponent } from '../base-item-field-input.component';

@Component({
  selector: 'app-general-item-field-input',
  templateUrl: './general-item-field-input.component.html',
  styleUrls: ['./general-item-field-input.component.scss']
})
export class GeneralItemFieldInputComponent extends BaseItemFieldInputComponent implements OnInit {

  public serializedText: string

  protected onNewValue(fieldType: number, serializedValue?: string, deserializedValue?: any) {
    this.serializedText = serializedValue
  }

  constructor() {
    super();
  }

  ngOnInit() {
  }

  onSerializedValueChanged(value){
    this.setNewSerializedValue(value)
  }
}
