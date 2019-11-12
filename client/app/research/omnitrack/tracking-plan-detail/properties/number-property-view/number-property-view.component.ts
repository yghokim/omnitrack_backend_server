import { Component, Input } from '@angular/core';
import { PropertyViewBase } from '../property-view-base';

@Component({
  selector: 'app-number-property-view',
  templateUrl: './number-property-view.component.html',
  styleUrls: ['./number-property-view.component.scss', '../property-views.scss']
})
export class NumberPropertyViewComponent extends PropertyViewBase<number> {

  @Input()
  min: number = Number.MIN_SAFE_INTEGER

  @Input()
  max: number = Number.MAX_SAFE_INTEGER

  onSetConfiguration(config: any) {
    if (config.min) {
      this.min = config.min
    }
    if (config.max) {
      this.max = config.max
    }
  }
}
