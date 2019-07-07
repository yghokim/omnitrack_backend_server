import { Input } from "@angular/core";
import { IFieldDbEntity } from "../../../../../omnitrack/core/db-entity-types";
import FieldHelper from "../../../../../omnitrack/core/fields/field.helper";
import FieldManager from "../../../../../omnitrack/core/fields/field.manager";

export class FieldMobileInputComponentBase<T extends FieldHelper> {

  private _field: IFieldDbEntity

  @Input()
  set field(f: IFieldDbEntity) {
    if (this._field !== f) {
      this._field = f
    }
  }

  get field(): IFieldDbEntity {
    return this._field
  }

  getFieldHelper(): T {
    return FieldManager.getHelper(this.field.type) as T
  }

  protected onNewFieldAdded(newField: IFieldDbEntity) {

  }
}
