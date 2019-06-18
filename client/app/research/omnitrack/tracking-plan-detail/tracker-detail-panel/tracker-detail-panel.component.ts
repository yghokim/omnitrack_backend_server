import { Component, OnInit, Input } from '@angular/core';
import { ITrackerDbEntity, IAttributeDbEntity, ITriggerDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import { TrackingPlanService } from '../../tracking-plan.service';
import { getAttributeIconName, makeShortenConditionString } from '../../omnitrack-helper';
import { TRACKER_COLOR_PALETTE } from '../../../../../../omnitrack/core/design/palette';
import * as color from 'color';
import * as deepEqual from 'deep-equal';
import { PresetFormat, FieldPresetPickerComponent, FieldPresetDialogData } from '../field-preset-picker/field-preset-picker.component';
import AttributeHelper from '../../../../../../omnitrack/core/attributes/attribute.helper';
import AttributeManager from '../../../../../../omnitrack/core/attributes/attribute.manager';
import attributeTypes from '../../../../../../omnitrack/core/attributes/attribute-types';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-tracker-detail-panel',
  templateUrl: './tracker-detail-panel.component.html',
  styleUrls: ['./tracker-detail-panel.component.scss', '../tracking-plan-detail.component.scss'],
  host: { class: 'sidepanel-container' }
})
export class TrackerDetailPanelComponent implements OnInit {

  static FIELD_PRESETS: Array<PresetFormat>  = [
    new PresetFormat(attributeTypes.ATTR_TYPE_SHORT_TEXT, "field_icon_shorttext", "Short Text", "A single-line text input"),
    new PresetFormat(attributeTypes.ATTR_TYPE_LONG_TEXT, "field_icon_longtext", "Long Text", "A multi-line text input"),
    new PresetFormat(attributeTypes.ATTR_TYPE_NUMBER, "field_icon_number", "Number", "A real number input"),
    new PresetFormat(attributeTypes.ATTR_TYPE_RATING, "field_icon_rating", "Stars", "A star rating widget")
  ]

  private _internalSubscriptions = new Subscription()

  private _tracker: ITrackerDbEntity

  @Input()
  set tracker(tracker: ITrackerDbEntity) {
    this._tracker = tracker
    this.selectedEntity = null
  }

  get tracker(): ITrackerDbEntity {
    return this._tracker
  }

  selectedType: string
  selectedEntity: ITriggerDbEntity | IAttributeDbEntity = null

  constructor(private planService: TrackingPlanService, private matDialog: MatDialog) {
  }

  ngOnInit() {
  }

  onFieldClicked(field: IAttributeDbEntity) {
    this.selectedEntity = field
    this.selectedType = 'field'
  }

  onReminderClicked(reminder: ITriggerDbEntity) {
    this.selectedEntity = reminder
    this.selectedType = 'reminder'
  }

  getReminders(): Array<ITriggerDbEntity> {
    return this.planService.getRemindersOf(this.tracker)
  }

  getReminderTitle(reminder: ITriggerDbEntity): string {
    return makeShortenConditionString(reminder)
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

  onAddFieldClicked() {
    this._internalSubscriptions.add(
      this.matDialog.open(FieldPresetPickerComponent, {
        data: {
          formats: TrackerDetailPanelComponent.FIELD_PRESETS
        } as FieldPresetDialogData
      }).afterClosed().subscribe(selectedIndex => {

      })
    )
  }

}
