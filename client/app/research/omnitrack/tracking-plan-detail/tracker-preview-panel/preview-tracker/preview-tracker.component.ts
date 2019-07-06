import { Component, OnInit, Input } from '@angular/core';
import { ITrackerDbEntity, IFieldDbEntity } from '../../../../../../../omnitrack/core/db-entity-types';
import { getTrackerColorString } from '../../../omnitrack-helper';
import * as color from 'color';
import { AMeasureFactory } from '../../../../../../../omnitrack/core/value-connection/measure-factory';
import { MeasureFactoryManager } from '../../../../../../../omnitrack/core/value-connection/measure-factory.manager';

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
    const c = color(getTrackerColorString(this.tracker))
    return c.darken(0.2).desaturate(0.3)
  }

  getAttachedFactory(field: IFieldDbEntity): AMeasureFactory{
    return MeasureFactoryManager.getMeasureFactoryByCode(field.connection.measure.code)
  }

}
