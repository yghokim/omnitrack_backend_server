import { Component, Input } from '@angular/core';
import { PropertyViewBase } from '../property-view-base';

@Component({
  selector: 'app-text-property-view',
  templateUrl: './text-property-view.component.html',
  styleUrls: ['./text-property-view.component.scss', '../property-views.scss']
})
export class TextPropertyViewComponent extends PropertyViewBase<string> {

  @Input()
  placeholder: string
}
