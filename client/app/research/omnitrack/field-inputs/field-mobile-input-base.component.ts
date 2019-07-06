import { Input } from "@angular/core";
import { IFieldDbEntity } from "../../../../../omnitrack/core/db-entity-types";

export class FieldMobiltInputComponentBase {

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

  protected onNewFieldAdded(newField: IFieldDbEntity) {

  }
}
