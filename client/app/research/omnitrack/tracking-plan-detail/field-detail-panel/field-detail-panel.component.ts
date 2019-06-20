import { Component, OnInit, Input } from '@angular/core';
import { IAttributeDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import AttributeManager from '../../../../../../omnitrack/core/attributes/attribute.manager';
import AttributeHelper from '../../../../../../omnitrack/core/attributes/attribute.helper';
import PropertyHelper from '../../../../../../omnitrack/core/properties/property.helper.base';

@Component({
  selector: 'app-field-detail-panel',
  templateUrl: './field-detail-panel.component.html',
  styleUrls: ['./field-detail-panel.component.scss', '../tracking-plan-detail.component.scss'],
  host: {class: 'sidepanel-container'}
})
export class FieldDetailPanelComponent implements OnInit {

  private _field: IAttributeDbEntity = null
  @Input('field')
  set setField(field: IAttributeDbEntity) {
    if (this._field !== field) {
      this._field = field
      this.onNewFieldSet(field)
    }
  }

  get field(): IAttributeDbEntity{
    return this._field
  }

  get attributeHelper(): AttributeHelper{
    return AttributeManager.getHelper(this.field.type)
  }

  constructor() { }

  ngOnInit() {
  }

  private onNewFieldSet(newField: IAttributeDbEntity){

  }

  getTypeInfos(){
    return AttributeManager.getTypeInfos()
  }

  getPropertyKeys(): Array<string>{
    return  this.attributeHelper.propertyKeys
  }

  getPropertyHelper(propertyKey: string): PropertyHelper<any>{
    return this.attributeHelper.getPropertyHelper(propertyKey)
  }

  getPropertyName(propertyKey: string): string{
    return this.attributeHelper.getPropertyName(propertyKey)
  }

  getFallbackPolicyEntries(): Array<{id: string, name: string}>{
    const array = []
    this.attributeHelper.supportedFallbackPolicyKeys.forEach(
      (value, key) => {
          array.push({id: key, name: value.label})
      })
    return array
  }
}
