import { Input, Output, EventEmitter } from "@angular/core";

export class PropertyViewBase<T>{

  @Input()
  title: string

  protected ngModelValue: number

  get propertyValue(): number{
    return this.ngModelValue
  }

  @Input()
  set propertyValue(value: number){
    this.ngModelValue = value
    this.propertyValueChange.emit(value)
  }

  @Output()
  propertyValueChange = new EventEmitter<number>()

  @Input()
  set configuration(config: any){
    this.onSetConfiguration(config)
  }

  protected onSetConfiguration(config: any){

  }

}