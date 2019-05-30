import { Component, OnInit } from "@angular/core";
import { BaseItemFieldInputComponent } from "../base-item-field-input.component";
import AttributeManager from "../../../../../omnitrack/core/attributes/attribute.manager";
import { ChoiceAttributeHelper } from "../../../../../omnitrack/core/attributes/choice.attribute.helper";
import { MatCheckboxChange } from "@angular/material";

@Component({
  selector: "app-choice-field-input",
  templateUrl: "./choice-field-input.component.html",
  styleUrls: ["./choice-field-input.component.scss"]
})
export class ChoiceFieldInputComponent extends BaseItemFieldInputComponent
  implements OnInit {
  isMultiSelection: Boolean;
  entries: Array<any>;
  checkBoxes: Array<Boolean> = [];
  result: Array<number> = [];
  radioSelect: number;

  protected onNewValue(
    attributeType: number,
    serializedValue?: string,
    deserializedValue?: any
  ) {
    const helper: ChoiceAttributeHelper = AttributeManager.getHelper(
      attributeType
    ) as any;
    const helpEntries = helper.getChoiceEntryList(this.attribute);
    const allowMultiSelection = helper.getAllowMultiSelection(this.attribute);
    this.entries = helpEntries.entries;
    this.isMultiSelection = helper.getAllowMultiSelection(this.attribute);
    this.updateCheckBoxes(this._deserializedValue);
    this.radioSelect = this._deserializedValue;
  }

  constructor() {
    super();
  }

  ngOnInit() {}

  onRadioSelect(value: number) {
    const helper: Array<number> = [value];
    this.setNewDeserializedValue(helper);
    console.log(this.radioSelect);
  }

  onCheckBoxSelect(value: MatCheckboxChange) {
    if (value.checked === true) {
      this.result.push(+value.source.value);
    } else {
      const index = this.result.indexOf(+value.source.value);
      this.result.splice(index, 1);
    }
    this.setNewDeserializedValue(this.result);
  }

  updateCheckBoxes(currentValues: number[]) {
    for (const i in this.entries) {
      if (currentValues.indexOf(this.entries[i].id) > -1) {
        this.checkBoxes[i] = true;
        this.result.push(+i);
      } else {
        this.checkBoxes[i] = false;
      }
    }
  }
}
