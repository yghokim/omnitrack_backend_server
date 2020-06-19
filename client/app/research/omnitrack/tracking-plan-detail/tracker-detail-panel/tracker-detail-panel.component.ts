import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ITrackerDbEntity, IFieldDbEntity, ITriggerDbEntity, TrackerLayoutElementType } from '../../../../../../omnitrack/core/db-entity-types';
import { TrackingPlanService } from '../../tracking-plan.service';
import { getFieldIconName, makeShortenConditionString, getTrackerColorString } from '../../omnitrack-helper';
import { TRACKER_COLOR_PALETTE } from '../../../../../../omnitrack/core/design/palette';
import * as color from 'color';
import * as deepEqual from 'deep-equal';
import { PresetFormat, FieldPresetPickerComponent, FieldPresetDialogData } from '../field-preset-picker/field-preset-picker.component';
import FieldManager from '../../../../../../omnitrack/core/fields/field.manager';
import fieldTypes from '../../../../../../omnitrack/core/fields/field-types';
import { Subscription } from 'rxjs';
import { MatDialog, MatBottomSheet } from '@angular/material';
import { RatingFieldHelper } from '../../../../../../omnitrack/core/fields/rating.field.helper';
import { RatingOptions } from '../../../../../../omnitrack/core/datatypes/rating_options';
import { TimePointFieldHelper } from '../../../../../../omnitrack/core/fields/time-point.field.helper';
import { TimeSpanFieldHelper } from '../../../../../../omnitrack/core/fields/time-span.field.helper';
import { ChoiceFieldHelper } from '../../../../../../omnitrack/core/fields/choice.field.helper';
import { YesNoDialogComponent } from '../../../../dialogs/yes-no-dialog/yes-no-dialog.component';
import { TriggerConstants } from '../../../../../../omnitrack/core/trigger/trigger-constants';
import { TextInputDialogComponent } from '../../../../dialogs/text-input-dialog/text-input-dialog.component';
import * as isUrl from 'is-url';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { TrackerColorPickerComponent } from './tracker-color-picker/tracker-color-picker.component';
import { TextFieldHelper } from '../../../../../../omnitrack/core/fields/text.field.helper';
import { trigger, transition, style, animate } from '@angular/animations';
import { PlanBrushAndLinkingService } from '../../plan-brush-and-linking.service';

@Component({
  selector: 'app-tracker-detail-panel',
  templateUrl: './tracker-detail-panel.component.html',
  styleUrls: ['./tracker-detail-panel.component.scss', '../tracking-plan-detail.component.scss'],
  host: { class: 'sidepanel-container' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('showHideTrigger', [
      transition(':enter', [
        style({ width: 0, overflowX: 'hidden' }),
        animate('0.5s ease-in-out', style({ width: '*' })),
      ]),
      transition(':leave', [
        style({ overflowX: 'hidden' }),
        animate('0.5s ease-in-out', style({ width: 0 }))
      ])
    ]),
  ]
})
export class TrackerDetailPanelComponent implements OnInit, OnDestroy {

  static FIELD_PRESETS: Array<PresetFormat> = [
    new PresetFormat(fieldTypes.ATTR_TYPE_TEXT, "field_icon_shorttext", "Short Text", "A single-line text input", (attr) => {
      FieldManager.getHelper(fieldTypes.ATTR_TYPE_TEXT)
        .setPropertyValue(attr, TextFieldHelper.PROPERTY_KEY_INPUT_TYPE, TextFieldHelper.INPUT_TYPE_SHORT)
    }),
    new PresetFormat(fieldTypes.ATTR_TYPE_TEXT, "field_icon_longtext", "Long Text", "A multi-line text input", (attr) => {
      FieldManager.getHelper(fieldTypes.ATTR_TYPE_TEXT)
        .setPropertyValue(attr, TextFieldHelper.PROPERTY_KEY_INPUT_TYPE, TextFieldHelper.INPUT_TYPE_LONG)
    }),
    new PresetFormat(fieldTypes.ATTR_TYPE_NUMBER, "field_icon_number", "Number", "A real number input"),
    new PresetFormat(fieldTypes.ATTR_TYPE_RATING, "field_icon_rating", "Stars", "A star rating widget"),
    new PresetFormat(fieldTypes.ATTR_TYPE_RATING, "field_icon_likert", "Likert Scale", "A Likert-scale slider", (attr) => {
      const options = new RatingOptions()
      options.type = RatingOptions.TYPE_LIKERT
      FieldManager.getHelper(fieldTypes.ATTR_TYPE_RATING).setPropertyValue(attr, RatingFieldHelper.PROPERTY_KEY_OPTIONS,
        options
      )
    }),
    new PresetFormat(fieldTypes.ATTR_TYPE_TIME, "field_icon_time_hour", "Time", "A specific time point", (attr) => {
      FieldManager.getHelper(fieldTypes.ATTR_TYPE_TIME)
        .setPropertyValue(attr, TimePointFieldHelper.PROPERTY_GRANULARITY, TimePointFieldHelper.GRANULARITY_MINUTE)
    }),
    new PresetFormat(fieldTypes.ATTR_TYPE_TIME, "field_icon_time_date", "Date", "A specific date", (attr) => {
      FieldManager.getHelper(fieldTypes.ATTR_TYPE_TIME)
        .setPropertyValue(attr, TimePointFieldHelper.PROPERTY_GRANULARITY, TimePointFieldHelper.GRANULARITY_DAY)
    }),
    new PresetFormat(fieldTypes.ATTR_TYPE_TIMESPAN, "field_icon_timer", "Time Range", "Ranged time points", (attr) => {
      FieldManager.getHelper(fieldTypes.ATTR_TYPE_TIMESPAN)
        .setPropertyValue(attr, TimeSpanFieldHelper.PROPERTY_GRANULARITY, TimePointFieldHelper.GRANULARITY_MINUTE)
    }),
    new PresetFormat(fieldTypes.ATTR_TYPE_TIMESPAN, "field_icon_time_range_date", "Date Range", "Ranged dates", (attr) => {
      FieldManager.getHelper(fieldTypes.ATTR_TYPE_TIMESPAN)
        .setPropertyValue(attr, TimeSpanFieldHelper.PROPERTY_GRANULARITY, TimePointFieldHelper.GRANULARITY_DAY)
    }),
    new PresetFormat(fieldTypes.ATTR_TYPE_LOCATION, "field_icon_location", "Location", "Location on map"),
    new PresetFormat(fieldTypes.ATTR_TYPE_IMAGE, "field_icon_image", "Image", "Image"),
    new PresetFormat(fieldTypes.ATTR_TYPE_AUDIO, "field_icon_audio", "Audio Record", "Audio record"),
    new PresetFormat(fieldTypes.ATTR_TYPE_CHOICE, "field_icon_singlechoice", "Single Choice", "Single choice input with radio buttons", (attr) => {
      FieldManager.getHelper(fieldTypes.ATTR_TYPE_CHOICE)
        .setPropertyValue(attr, ChoiceFieldHelper.PROPERTY_MULTISELECTION, false)
    }),
    new PresetFormat(fieldTypes.ATTR_TYPE_CHOICE, "field_icon_multiplechoice", "Multiple Choice", "Multiple choice input with checkboxes", (attr) => {
      FieldManager.getHelper(fieldTypes.ATTR_TYPE_CHOICE)
        .setPropertyValue(attr, ChoiceFieldHelper.PROPERTY_MULTISELECTION, true)
    }),
  ]

  private _internalSubscriptions = new Subscription()

  private _tracker: ITrackerDbEntity

  @Input()
  set tracker(tracker: ITrackerDbEntity) {
    /*if (this._tracker && this._tracker._id === tracker._id) {
      if (this.selectedEntity != null) {
        switch (this.selectedType) {
          case "field":
            const newInstance = tracker.fields.find(a => a._id === this.selectedEntity._id)
            if (newInstance != null) {
              this.selectedEntity = newInstance
            } else {
              this.selectedEntity = null
              this.selectedType = null
            }
            break;
          case "reminder":
            const newReminderInstance = this.getReminders().find(r => r._id === this.selectedEntity._id)
            if (newReminderInstance != null) {
              this.selectedEntity = newReminderInstance
            } else {
              this.selectedEntity = null
              this.selectedType = null
            }
            break;
        }
      }
    } else {
      this.selectedEntity = null
      this.selectedType = null
    }*/

    this._tracker = tracker
  }

  get trackerLayout(): Array<TrackerLayoutElementType> {
    if (this._tracker && this._tracker.layout) {
      return this._tracker.layout
    } else { return [] }
  }

  set trackerLayout(newSet: Array<TrackerLayoutElementType>) {
    this._tracker.layout.sort((a, b) => {
      const aIndex = newSet.findIndex(e => e.reference === a.reference)
      const bIndex = newSet.findIndex(e => e.reference === b.reference)
      if (aIndex < bIndex) {
        return -1
      } else if (aIndex > bIndex) {
        return 1
      } else { return 0 }
    })
  }

  getFieldById(fieldId: string): IFieldDbEntity {
    return this._tracker.fields.find(a => a._id === fieldId || a.localId === fieldId)
  }

  get tracker(): ITrackerDbEntity {
    return this._tracker
  }

  constructor(public planService: TrackingPlanService, private matDialog: MatDialog, private matBottomSheet: MatBottomSheet, private detector: ChangeDetectorRef, public brushAndLinking: PlanBrushAndLinkingService) {
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  onColorClicked() {
    this._internalSubscriptions.add(
      this.matDialog
        .open(TrackerColorPickerComponent, { data: this.tracker.color })
        .afterClosed().subscribe(pickedColor => {
          if (pickedColor) {
            this.tracker.color = color(pickedColor).rgbNumber() + 0xff000000
            this.detector.markForCheck()
          }
        })
    )
  }

  onFieldDragDrop(event: any) {
    const layout = this.trackerLayout
    moveItemInArray(layout, event.previousIndex, event.currentIndex);
    this.trackerLayout = layout
    this.detector.markForCheck()
  }

  onFieldClicked(field: IFieldDbEntity) {
    if (this.planService.isIdSelectedInNavSync(field._id) === true) {
      this.planService.unselectElement(field._id)
    } else {
      this.planService.selectField(field)
    }
  }

  onReminderClicked(reminder: ITriggerDbEntity) {
    if (this.planService.isIdSelectedInNavSync(reminder._id) === true) {
      this.planService.unselectElement(reminder._id)
    } else {
      this.planService.selectReminder(reminder)
    }
  }

  getReminders(): Array<ITriggerDbEntity> {
    return this.planService.getRemindersOf(this.tracker)
  }

  getReminderTitle(reminder: ITriggerDbEntity): string {
    return makeShortenConditionString(reminder)
  }

  getFieldIconName(attr: IFieldDbEntity): string {
    return getFieldIconName(attr)
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

  getTrackerColorString(): string {
    return getTrackerColorString(this.tracker)
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
          this.planService.selectField(newField)
          this.detector.markForCheck()
        }
      })
    )
  }

  onAddTextPanelClicked() {

  }

  onRemoveFieldClicked(field: IFieldDbEntity) {
    this._internalSubscriptions.add(
      this.matDialog.open(YesNoDialogComponent, {
        data: {
          title: "Remove Field",
          message: "Do you want to remove this field?"
        }
      }).afterClosed().subscribe(ok => {
        if (ok === true) {
          if (this.planService.currentPlan.removeField(field) === true) {
            this.planService.unselectElement(field._id)
            this.detector.markForCheck()
          }
        }
      })
    )
  }

  onAddReminderClicked() {
    const newReminder = this.planService.currentPlan.appendNewTrigger(TriggerConstants.ACTION_TYPE_REMIND, TriggerConstants.CONDITION_TYPE_TIME)
    newReminder.trackers = [this.tracker._id]
    this.planService.selectReminder(newReminder)
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
              this.planService.unselectElement(reminder._id)
              this.detector.markForCheck()
            }
          }
        })
    )
  }


  onRedirectUrlButtonClicked() {
    this._internalSubscriptions.add(
      this.matDialog.open(TextInputDialogComponent, {
        data: {
          title: "Change Redirect Url",
          message: "Insert the redirect url which will forward the user after logging each tracker item. Mostly starts with http:// or https://",
          placeholder: "Enter URL",
          validator: (text) => text == null ? true : (text.length > 0 ? isUrl(text) : true),
          prefill: this.tracker.redirectUrl
        }
      }).afterClosed().subscribe(text => {
        if (text != null) {
          const newChange = text.length > 0 ? text : null
          if (this.tracker.redirectUrl !== newChange) {
            this.tracker.redirectUrl = newChange
            this.detector.markForCheck()
          }
        }
      })
    )
  }

  getRedirectUrlHostName() {
    if (this.tracker && this.tracker.redirectUrl && this.tracker.redirectUrl.length > 0) {
      try {
        return new URL(this.tracker.redirectUrl).hostname
      } catch (ex) {
        console.log(ex)
        return null
      }
    } else { return null }
  }
}
