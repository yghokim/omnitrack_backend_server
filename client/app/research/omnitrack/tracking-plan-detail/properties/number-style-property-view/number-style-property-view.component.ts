import { Component } from '@angular/core';
import { PropertyViewBase } from '../property-view-base';
import { NumberStyle } from '../../../../../../../omnitrack/core/datatypes/number_style';

@Component({
  selector: 'app-number-style-property-view',
  templateUrl: './number-style-property-view.component.html',
  styleUrls: ['./number-style-property-view.component.scss', '../property-views.scss']
})
export class NumberStylePropertyViewComponent extends PropertyViewBase<NumberStyle> {

  onShowCommaChanged(showComma: boolean) {
    if (showComma === true) {
      this.propertyValue.comma = 3
    } else { this.propertyValue.comma = 0 }

    this.propertyValueChange.emit(this.propertyValue)
  }

  onShowFractionPartChanged(show: boolean){
    if (show === true) {
      this.propertyValue.fraction = 2
    } else { this.propertyValue.fraction = 0 }

    this.propertyValueChange.emit(this.propertyValue)
  }
}
