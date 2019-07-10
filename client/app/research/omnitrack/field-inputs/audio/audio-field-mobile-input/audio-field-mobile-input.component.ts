import { Component, OnInit } from '@angular/core';
import { FieldMobileInputComponentBase } from '../../field-mobile-input-base.component';
import { AudioRecordFieldHelper } from '../../../../../../../omnitrack/core/fields/audiorecord.field.helper';

@Component({
  selector: 'app-audio-field-mobile-input',
  templateUrl: './audio-field-mobile-input.component.html',
  styleUrls: ['./audio-field-mobile-input.component.scss']
})
export class AudioFieldMobileInputComponent extends FieldMobileInputComponentBase<AudioRecordFieldHelper> implements OnInit {

  constructor() { super() }

  ngOnInit() {
  }

}
