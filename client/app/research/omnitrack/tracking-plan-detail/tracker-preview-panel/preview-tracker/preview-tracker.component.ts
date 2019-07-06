import { Component, OnInit, Input } from '@angular/core';
import { ITrackerDbEntity } from '../../../../../../../omnitrack/core/db-entity-types';
import { getTrackerColorString } from '../../../omnitrack-helper';

@Component({
  selector: 'app-preview-tracker',
  templateUrl: './preview-tracker.component.html',
  styleUrls: ['./preview-tracker.component.scss']
})
export class PreviewTrackerComponent implements OnInit {

  @Input()
  tracker: ITrackerDbEntity

  constructor() {

  }

  ngOnInit() {

  }

  getTrackerColorString(): string{
    return getTrackerColorString(this.tracker)
  }

}
