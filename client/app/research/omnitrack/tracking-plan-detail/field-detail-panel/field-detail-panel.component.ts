import { Component, OnInit, Input } from '@angular/core';
import { IFieldDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import FieldManager from '../../../../../../omnitrack/core/fields/field.manager';
import FieldHelper from '../../../../../../omnitrack/core/fields/field.helper';
import PropertyHelper from '../../../../../../omnitrack/core/properties/property.helper.base';

@Component({
  selector: 'app-field-detail-panel',
  templateUrl: './field-detail-panel.component.html',
  styleUrls: ['./field-detail-panel.component.scss', '../tracking-plan-detail.component.scss'],
  host: {class: 'sidepanel-container'}
})
export class FieldDetailPanelComponent implements OnInit {

  private _field: IFieldDbEntity = null
  @Input('field')
  set setField(field: IFieldDbEntity) {
    if (this._field !== field) {
      this._field = field
      this.onNewFieldSet(field)
    }
  }

  get field(): IFieldDbEntity{
    return this._field
  }

  get fieldHelper(): FieldHelper{
    return FieldManager.getHelper(this.field.type)
  }

  constructor() { }

  ngOnInit() {
  }

  private onNewFieldSet(newField: IFieldDbEntity){

  }

  getTypeInfos(){
    return FieldManager.getTypeInfos()
  }

  getPropertyKeys(): Array<string>{
    return  this.fieldHelper.propertyKeys
  }

  getPropertyHelper(propertyKey: string): PropertyHelper<any>{
    return this.fieldHelper.getPropertyHelper(propertyKey)
  }

  getPropertyName(propertyKey: string): string{
    return this.fieldHelper.getPropertyName(propertyKey)
  }

  getFallbackPolicyEntries(): Array<{id: string, name: string}>{
    const array = []
    this.fieldHelper.supportedFallbackPolicyKeys.forEach(
      (value, key) => {
          array.push({id: key, name: value.label})
      })
    return array
  }
}
