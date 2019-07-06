import { Component, OnInit } from '@angular/core';
import { FieldMobiltInputComponentBase } from '../../field-mobile-input-base.component';

@Component({
  selector: 'app-time-field-mobile-input',
  templateUrl: './time-field-mobile-input.component.html',
  styleUrls: ['./time-field-mobile-input.component.scss']
})
export class TimeFieldMobileInputComponent extends FieldMobiltInputComponentBase implements OnInit {

  constructor() {
    super()
   }

  ngOnInit() {
  }

}
