import { Component, OnInit } from '@angular/core';
import { FieldMobileInputComponentBase } from '../../field-mobile-input-base.component';
import { ImageFieldHelper } from '../../../../../../../omnitrack/core/fields/image.field.helper';

@Component({
  selector: 'app-image-field-mobile-input',
  templateUrl: './image-field-mobile-input.component.html',
  styleUrls: ['./image-field-mobile-input.component.scss']
})
export class ImageFieldMobileInputComponent extends FieldMobileInputComponentBase<ImageFieldHelper> implements OnInit {

  constructor() {
    super()
   }

  ngOnInit() {
  }

}
