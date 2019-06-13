import { Component, OnInit, Input } from '@angular/core';
import { IAttributeDbEntity } from '../../../../../../omnitrack/core/db-entity-types';

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

  constructor() { }

  ngOnInit() {
  }

  private onNewFieldSet(newField: IAttributeDbEntity){

  }


}
