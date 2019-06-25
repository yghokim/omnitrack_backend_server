import { Component } from '@angular/core';
import { PropertyViewBase } from '../property-view-base';

@Component({
  selector: 'app-boolean-property-view',
  templateUrl: './boolean-property-view.component.html',
  styleUrls: ['./boolean-property-view.component.scss', '../property-views.scss']
})
export class BooleanPropertyViewComponent extends PropertyViewBase<boolean> {

}
