import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
import { MatDialog, MatBottomSheet } from '@angular/material';
import { RatingAttributeHelper } from '../../../../../../omnitrack/core/attributes/rating.attribute.helper';
import { RatingOptions } from '../../../../../../omnitrack/core/datatypes/rating_options';
import { TimePointAttributeHelper } from '../../../../../../omnitrack/core/attributes/time-point.attribute.helper';
import { TimeSpanAttributeHelper } from '../../../../../../omnitrack/core/attributes/time-span.attribute.helper';
import { ChoiceAttributeHelper } from '../../../../../../omnitrack/core/attributes/choice.attribute.helper';
import { YesNoDialogComponent } from '../../../../dialogs/yes-no-dialog/yes-no-dialog.component';
import { TriggerConstants } from '../../../../../../omnitrack/core/trigger/trigger-constants';

@Component({
  selector: 'app-tracker-detail-panel',
  templateUrl: './tracker-detail-panel.component.html',
  styleUrls: ['./tracker-detail-panel.component.scss', '../tracking-plan-detail.component.scss'],
  host: { class: 'sidepanel-container' },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackerDetailPanelComponent implements OnInit {

  static FIELD_PRESETS: Array<PresetFormat> = [
    new PresetFormat(attributeTypes.ATTR_TYPE_SHORT_TEXT, "field_icon_shorttext", "Short Text", "A single-line text input"),
    new PresetFormat(attributeTypes.ATTR_TYPE_LONG_TEXT, "field_icon_longtext", "Long Text", "A multi-line text input"),
    new PresetFormat(attributeTypes.ATTR_TYPE_NUMBER, "field_icon_number", "Number", "A real number input"),
    new PresetFormat(attributeTypes.ATTR_TYPE_RATING, "field_icon_rating", "Stars", "A star rating widget"),
    new PresetFormat(attributeTypes.ATTR_TYPE_RATING, "field_icon_likert", "Likert Scale", "A Likert-scale slider", (attr) => {
      const options = new RatingOptions()
      options.type = RatingOptions.TYPE_LIKERT
      AttributeManager.getHelper(attributeTypes.ATTR_TYPE_RATING).setPropertyValue(attr, RatingAttributeHelper.PROPERTY_KEY_OPTIONS,
        options
      )
    }),
    new PresetFormat(attributeTypes.ATTR_TYPE_TIME, "field_icon_time_hour", "Time", "A specific time point", (attr) => {
      AttributeManager.getHelper(attributeTypes.ATTR_TYPE_TIME)
        .setPropertyValue(attr, TimePointAttributeHelper.PROPERTY_GRANULARITY, TimePointAttributeHelper.GRANULARITY_MINUTE)
    }),
    new PresetFormat(attributeTypes.ATTR_TYPE_TIME, "field_icon_time_date", "Date", "A specific date", (attr) => {
      AttributeManager.getHelper(attributeTypes.ATTR_TYPE_TIME)
        .setPropertyValue(attr, TimePointAttributeHelper.PROPERTY_GRANULARITY, TimePointAttributeHelper.GRANULARITY_DAY)
    }),
    new PresetFormat(attributeTypes.ATTR_TYPE_TIMESPAN, "field_icon_timer", "Time Range", "Ranged time points", (attr) => {
      AttributeManager.getHelper(attributeTypes.ATTR_TYPE_TIMESPAN)
        .setPropertyValue(attr, TimeSpanAttributeHelper.PROPERTY_GRANULARITY, TimePointAttributeHelper.GRANULARITY_MINUTE)
    }),
    new PresetFormat(attributeTypes.ATTR_TYPE_TIMESPAN, "field_icon_time_range_date", "Date Range", "Ranged dates", (attr) => {
      AttributeManager.getHelper(attributeTypes.ATTR_TYPE_TIMESPAN)
        .setPropertyValue(attr, TimeSpanAttributeHelper.PROPERTY_GRANULARITY, TimePointAttributeHelper.GRANULARITY_DAY)
    }),
    new PresetFormat(attributeTypes.ATTR_TYPE_LOCATION, "field_icon_location", "Location", "Location on map"),
    new PresetFormat(attributeTypes.ATTR_TYPE_IMAGE, "field_icon_image", "Image", "Image"),
    new PresetFormat(attributeTypes.ATTR_TYPE_AUDIO, "field_icon_audio", "Audio Record", "Audio record"),
    new PresetFormat(attributeTypes.ATTR_TYPE_CHOICE, "field_icon_singlechoice", "Single Choice", "Single choice input with radio buttons", (attr) => {
      AttributeManager.getHelper(attributeTypes.ATTR_TYPE_CHOICE)
        .setPropertyValue(attr, ChoiceAttributeHelper.PROPERTY_MULTISELECTION, false)
    }),
    new PresetFormat(attributeTypes.ATTR_TYPE_CHOICE, "field_icon_multiplechoice", "Multiple Choice", "Multiple choice input with checkboxes", (attr) => {
      AttributeManager.getHelper(attributeTypes.ATTR_TYPE_CHOICE)
        .setPropertyValue(attr, ChoiceAttributeHelper.PROPERTY_MULTISELECTION, true)
    }),
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

  constructor(private planService: TrackingPlanService, private matDialog: MatDialog, private matBottomSheet: MatBottomSheet, private detector: ChangeDetectorRef) {
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
      this.matBottomSheet.open(FieldPresetPickerComponent, {
        data: {
          formats: TrackerDetailPanelComponent.FIELD_PRESETS
        } as FieldPresetDialogData,
        panelClass: 'no-padding'
      }).afterDismissed().subscribe((selectedPreset: PresetFormat) => {
        if (selectedPreset) {
          const newField = this.planService.currentPlan.appendNewField(this.tracker, selectedPreset.fieldType, selectedPreset.label)
          if (selectedPreset.generator) {
            selectedPreset.generator(newField)
          }
          this.selectedEntity = newField
          this.selectedType = "field"
          this.detector.markForCheck()
        }
      })
    )
  }

  onRemoveFieldClicked(field: IAttributeDbEntity) {
    this._internalSubscriptions.add(
      this.matDialog.open(YesNoDialogComponent, {
        data: {
          title: "Remove Field",
          message: "Do you want to remove this field?"
        }
      }).afterClosed().subscribe(ok => {
        if (ok === true) {
          if (this.planService.currentPlan.removeField(field) === true) {
            if (this.selectedEntity._id === field._id) {
              this.selectedEntity = null
              this.selectedType = null
            }
            this.detector.markForCheck()
          }
        }
      })
    )
  }

  onAddReminderClicked() {
    const newReminder = this.planService.currentPlan.appendNewTrigger(TriggerConstants.ACTION_TYPE_REMIND, TriggerConstants.CONDITION_TYPE_TIME)
    newReminder.trackers = [this.tracker._id]
    this.selectedEntity = newReminder
    this.selectedType = "reminder"
    this.detector.markForCheck()
  }

  onRemoveReminderClicked(reminder: ITriggerDbEntity) {
    this._internalSubscriptions.add(
      this.matDialog.open(YesNoDialogComponent,
        {
          data: {
            title: "Remove Reminder",
            message: "Do you want to remove the reminder?"
          }
        }).afterClosed().subscribe((result) => {
          if (result === true) {
            if (this.planService.currentPlan.removeTrigger(reminder)) {
              if (this.selectedEntity._id === reminder._id) {
                this.selectedEntity = null
                this.selectedType = null
              }
              this.detector.markForCheck()
            }
          }
        })
    )
  }
}
