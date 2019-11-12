import { Component, OnInit } from '@angular/core';
import { PropertyViewBase } from '../property-view-base';
import { RatingOptions } from '../../../../../../../omnitrack/core/datatypes/rating_options';

@Component({
  selector: 'app-rating-options-property-view',
  templateUrl: './rating-options-property-view.component.html',
  styleUrls: ['./rating-options-property-view.component.scss', '../property-views.scss']
})
export class RatingOptionsPropertyViewComponent extends PropertyViewBase<RatingOptions> {
}
