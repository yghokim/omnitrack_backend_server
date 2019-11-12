import { Input, Output, EventEmitter } from "@angular/core";

export class PropertyViewBase<T> {

  @Input()
  title: string

  protected ngModelValue: T

  get propertyValue(): T {
    return this.ngModelValue
  }

  @Input()
  set propertyValue(value: T) {
    this.ngModelValue = value
    this.propertyValueChange.emit(value)
    this.onSetPropertyValue(value)
  }

  @Output()
  propertyValueChange = new EventEmitter<T>()

  @Input()
  set configuration(config: any) {
    this.onSetConfiguration(config)
  }

  protected onSetPropertyValue(value: T) {

  }

  protected onSetConfiguration(config: any) {

  }

}