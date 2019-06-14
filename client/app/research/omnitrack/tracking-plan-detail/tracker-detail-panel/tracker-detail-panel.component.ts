import { Component, OnInit, Input } from '@angular/core';
import { ITrackerDbEntity, IAttributeDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import { TrackingPlanService } from '../../tracking-plan.service';
import { getAttributeIconName } from '../../omnitrack-helper';
import { TRACKER_COLOR_PALETTE } from '../../../../../../omnitrack/core/design/palette';
import * as color from 'color';
import * as deepEqual from 'deep-equal';

@Component({
  selector: 'app-tracker-detail-panel',
  templateUrl: './tracker-detail-panel.component.html',
  styleUrls: ['./tracker-detail-panel.component.scss', '../tracking-plan-detail.component.scss'],
  host: { class: 'sidepanel-container' }
})
export class TrackerDetailPanelComponent implements OnInit {

  private _tracker: ITrackerDbEntity

  @Input()
  set tracker(tracker: ITrackerDbEntity){
    this._tracker = tracker
    this.selectedField = null
  }

  get tracker(): ITrackerDbEntity{
    return this._tracker
  }

  selectedField: IAttributeDbEntity = null

  constructor(private planService: TrackingPlanService) {

  }

  ngOnInit() {
  }

  onFieldClicked(field: IAttributeDbEntity) {
    this.selectedField = field
  }

  getAttributeIconName(attr: IAttributeDbEntity): string {
    return getAttributeIconName(attr)
  }

  getTrackerColorPalette(): Array<string> {
    return TRACKER_COLOR_PALETTE
  }

  getCurrentColorIndex(): string {
    const trackerColor = color(this.tracker.color)
    for (const c of TRACKER_COLOR_PALETTE) {
      if (deepEqual(color(c).rgb(), trackerColor.rgb())) {
        return c
      }
    }
    return null
  }

  onColorButtonClicked(colorString: string) {
    console.log(color(colorString).rgbNumber())
    this.tracker.color = color(colorString).rgbNumber() + 0xff000000
  }

}
