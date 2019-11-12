import { Component, OnInit } from '@angular/core';
import { FieldMobileInputComponentBase } from '../../field-mobile-input-base.component';
import { LocationFieldHelper } from '../../../../../../../omnitrack/core/fields/location.field.helper';

@Component({
  selector: 'app-location-field-mobile-input',
  templateUrl: './location-field-mobile-input.component.html',
  styleUrls: ['./location-field-mobile-input.component.scss']
})
export class LocationFieldMobileInputComponent extends FieldMobileInputComponentBase<LocationFieldHelper> implements OnInit {

  constructor() { super() }

  ngOnInit() {
  }

}
