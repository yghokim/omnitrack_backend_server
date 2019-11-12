import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { IFieldDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import FieldManager from '../../../../../../omnitrack/core/fields/field.manager';
import FieldHelper from '../../../../../../omnitrack/core/fields/field.helper';
import { EPropertyType } from '../../../../../../omnitrack/core/properties/property.types';
import { MeasureFactoryManager } from '../../../../../../omnitrack/core/value-connection/measure-factory.manager';
import { TrackingPlanService } from '../../tracking-plan.service';
import { AMeasureFactory } from '../../../../../../omnitrack/core/value-connection/measure-factory';
import { TimeQueryPreset, OTTimeQuery, TIMEQUERY_PRESETS } from '../../../../../../omnitrack/core/value-connection/value-connection';
import * as deepEqual from 'deep-equal';

@Component({
  selector: 'app-field-detail-panel',
  templateUrl: './field-detail-panel.component.html',
  styleUrls: ['./field-detail-panel.component.scss', '../tracking-plan-detail.component.scss', '../selectable-menu-item/selectable-menu-item.component.scss'],
  host: { class: 'sidepanel-container' }
})
export class FieldDetailPanelComponent implements OnInit, OnDestroy {

  private _field: IFieldDbEntity = null
  @Input('field')
  set setField(field: IFieldDbEntity) {
    if (this._field !== field) {
      this._field = field
      this.onNewFieldSet(field)
    }
  }

  get field(): IFieldDbEntity {
    return this._field
  }

  get fieldHelper(): FieldHelper {
    return FieldManager.getHelper(this.field.type)
  }

  isConnectionSelected = false

  constructor(private planService: TrackingPlanService) { }

  ngOnInit() {
  }

  ngOnDestroy(){
    this.isConnectionSelected = false
  }

  private onNewFieldSet(newField: IFieldDbEntity) {

  }

  getTypeInfos() {
    return FieldManager.getTypeInfos()
  }

  getPropertyKeys(): Array<string> {
    return this.fieldHelper.propertyKeys
  }

  getPropertyType(propertyKey: string): EPropertyType {
    return this.fieldHelper.getPropertyType(propertyKey)
  }

  getPropertyName(propertyKey: string): string {
    return this.fieldHelper.getPropertyName(propertyKey)
  }

  getFallbackPolicyEntries(): Array<{ id: string, name: string }> {
    const array = []
    this.fieldHelper.supportedFallbackPolicyKeys.forEach(
      (value, key) => {
        array.push({ id: key, name: value.label })
      })
    return array
  }

  isMeasureFactoryAttachable(): boolean {
    return MeasureFactoryManager
      .getAttachableMeasureFactories(this.field, this.planService.currentPlan).length > 0
  }

  getFactoryByCode(code: string): AMeasureFactory{
    return MeasureFactoryManager.getMeasureFactoryByCode(code)
  }

  convertQueryToPreset(query: OTTimeQuery): TimeQueryPreset{
    return TIMEQUERY_PRESETS.find(p => deepEqual(p.query, query))
  }

  onConnectionClicked(){
    this.isConnectionSelected = !this.isConnectionSelected
  }
}
