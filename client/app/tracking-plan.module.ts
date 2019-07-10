import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { CommonModule } from '@angular/common';
import { SharedModule } from './shared/shared.module';

import { MonacoEditorModule } from "ngx-monaco-editor";

import { ExperimentOmniTrackComponent } from "./experiment-omnitrack/experiment-omnitrack.component";
import { OmniTrackPlanListComponent } from "./research/omnitrack/omnitrack-plan-list.component";
import { TrackingPlanCodeEditorComponent } from "./research/omnitrack/tracking-plan-code-editor/tracking-plan-code-editor.component";

import { LockConfigurationSheetComponent } from "./research/omnitrack/entities/lock-flag-button/lock-configuration-sheet/lock-configuration-sheet.component";

import { TrackingPlanListElementComponent } from './research/omnitrack/tracking-plan-list-element/tracking-plan-list-element.component';

import { NewTrackingPlanDialogComponent } from "./research/omnitrack/new-tracking-plan-dialog/new-tracking-plan-dialog.component";
import { TrackingPlanDetailComponent } from './research/omnitrack/tracking-plan-detail/tracking-plan-detail.component';

import { TrackerViewComponent } from "./research/omnitrack/entities/tracker-view/tracker-view.component";
import { TriggerViewComponent } from "./research/omnitrack/entities/trigger-view/trigger-view.component";
import { LockFlagButtonComponent } from "./research/omnitrack/entities/lock-flag-button/lock-flag-button.component";
import { SelectableMenuItemComponent } from './research/omnitrack/tracking-plan-detail/selectable-menu-item/selectable-menu-item.component';
import { TrackerDetailPanelComponent } from './research/omnitrack/tracking-plan-detail/tracker-detail-panel/tracker-detail-panel.component';
import { FieldDetailPanelComponent } from './research/omnitrack/tracking-plan-detail/field-detail-panel/field-detail-panel.component';
import { TriggerDetailPanelComponent } from './research/omnitrack/tracking-plan-detail/trigger-detail-panel/trigger-detail-panel.component';
import { BooleanPropertyViewComponent } from './research/omnitrack/tracking-plan-detail/properties/boolean-property-view/boolean-property-view.component';
import { SelectionPropertyViewComponent } from './research/omnitrack/tracking-plan-detail/properties/selection-property-view/selection-property-view.component';
import { NumberPropertyViewComponent } from './research/omnitrack/tracking-plan-detail/properties/number-property-view/number-property-view.component';
import { TextPropertyViewComponent } from './research/omnitrack/tracking-plan-detail/properties/text-property-view/text-property-view.component';
import { RatingOptionsPropertyViewComponent } from './research/omnitrack/tracking-plan-detail/properties/rating-options-property-view/rating-options-property-view.component';
import { EntryListPropertyViewComponent } from './research/omnitrack/tracking-plan-detail/properties/entry-list-property-view/entry-list-property-view.component';
import { NumberStylePropertyViewComponent } from './research/omnitrack/tracking-plan-detail/properties/number-style-property-view/number-style-property-view.component';
import { DayOfWeekCheckerComponent } from "./research/omnitrack/tracking-plan-detail/trigger-detail-panel/day-of-week-checker/day-of-week-checker.component";
import { HourRangePickerComponent } from "./research/omnitrack/tracking-plan-detail/trigger-detail-panel/hour-range-picker/hour-range-picker.component";
import { FieldPresetPickerComponent } from "./research/omnitrack/tracking-plan-detail/field-preset-picker/field-preset-picker.component";
import { TrackerPickerComponent } from "./research/omnitrack/tracking-plan-detail/tracker-picker/tracker-picker.component";
import { TrackerColorPickerComponent } from "./research/omnitrack/tracking-plan-detail/tracker-detail-panel/tracker-color-picker/tracker-color-picker.component";
import { ChangeCheckGuard } from "./services/change-check.guard";
import { ConnectionDetailPanelComponent } from "./research/omnitrack/tracking-plan-detail/connection-detail-panel/connection-detail-panel.component";
import { MeasureFactorySelectorComponent } from "./research/omnitrack/tracking-plan-detail/measure-factory-selector/measure-factory-selector.component";
import { FactoryListComponent } from "./research/omnitrack/tracking-plan-detail/measure-factory-selector/factory-list.component";
import { TrackerPreviewPanelComponent } from "./research/omnitrack/tracking-plan-detail/tracker-preview-panel/tracker-preview-panel.component";
import { PreviewTrackerComponent } from './research/omnitrack/tracking-plan-detail/tracker-preview-panel/preview-tracker/preview-tracker.component';
import { TimeFieldMobileInputComponent } from './research/omnitrack/field-inputs/time/time-field-mobile-input/time-field-mobile-input.component';
import { LocationFieldMobileInputComponent } from './research/omnitrack/field-inputs/location/location-field-mobile-input/location-field-mobile-input.component';
import { ChoiceFieldMobileInputComponent } from './research/omnitrack/field-inputs/choice/choice-field-mobile-input/choice-field-mobile-input.component';
import { TextFieldMobileInputComponent } from './research/omnitrack/field-inputs/text/text-field-mobile-input/text-field-mobile-input.component';
import { RatingFieldMobileInputComponent } from './research/omnitrack/field-inputs/rating/rating-field-mobile-input/rating-field-mobile-input.component';
import { ImageFieldMobileInputComponent } from './research/omnitrack/field-inputs/image/image-field-mobile-input/image-field-mobile-input.component';
import { AudioFieldMobileInputComponent } from './research/omnitrack/field-inputs/audio/audio-field-mobile-input/audio-field-mobile-input.component';
import { TimeSpanFieldMobileInputComponent } from './research/omnitrack/field-inputs/timespan/timespan-field-mobile-input/timespan-field-mobile-input.component';
import { NumberFieldMobileInputComponent } from './research/omnitrack/field-inputs/number/number-field-mobile-input/number-field-mobile-input.component';
import { StarPickerMobileInputComponent } from './research/omnitrack/field-inputs/rating/star-picker-mobile-input/star-picker-mobile-input.component';
import { LikertPickerMobileInputComponent } from './research/omnitrack/field-inputs/rating/likert-picker-mobile-input/likert-picker-mobile-input.component';
import { AngularResizedEventModule } from 'angular-resize-event';

const routes: Routes = [
  {
    path: "",
    component: ExperimentOmniTrackComponent,
    children: [
      { path: "", redirectTo: "plans", pathMatch: "full" },
      {
        path: "plans",
        component: OmniTrackPlanListComponent,
        data: { title: "Tracking Plans" }
      },

      {
        path: "plans/:planKey",
        component: TrackingPlanDetailComponent,
        canDeactivate: [ChangeCheckGuard],
        data: {
          title: "Tracking Plan Detail",
          backTitle: "Plan List",
          backNavigationUrl: "./omnitrack/plans"
        }
      },
      {
        path: "plans/code/:planKey",
        component: TrackingPlanCodeEditorComponent,
        data: {
          title: "Edit Tracking Plan Code",
          backTitle: "Plan List",
          backNavigationUrl: "./omnitrack/plans"
        }
      }
    ]
  }
]

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes),
    MonacoEditorModule.forRoot(),
    AngularResizedEventModule
  ],

  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    ExperimentOmniTrackComponent,
    TrackingPlanCodeEditorComponent,
    OmniTrackPlanListComponent,
    LockConfigurationSheetComponent,
    TrackingPlanListElementComponent,
    NewTrackingPlanDialogComponent,
    TrackingPlanDetailComponent,
    TrackerViewComponent,
    TriggerViewComponent,
    LockFlagButtonComponent,
    SelectableMenuItemComponent,
    TrackerDetailPanelComponent,
    FieldDetailPanelComponent,
    TriggerDetailPanelComponent,
    BooleanPropertyViewComponent,
    SelectionPropertyViewComponent,
    NumberPropertyViewComponent,
    TextPropertyViewComponent,
    RatingOptionsPropertyViewComponent,
    EntryListPropertyViewComponent,
    NumberStylePropertyViewComponent,
    DayOfWeekCheckerComponent,
    HourRangePickerComponent,
    FieldPresetPickerComponent,
    TrackerPickerComponent,
    TrackerColorPickerComponent,
    ConnectionDetailPanelComponent,
    MeasureFactorySelectorComponent,
    FactoryListComponent,
    TrackerPreviewPanelComponent,
    PreviewTrackerComponent,
    TimeFieldMobileInputComponent,
    LocationFieldMobileInputComponent,
    ChoiceFieldMobileInputComponent,
    TextFieldMobileInputComponent,
    RatingFieldMobileInputComponent,
    ImageFieldMobileInputComponent,
    AudioFieldMobileInputComponent,
    TimeSpanFieldMobileInputComponent,
    NumberFieldMobileInputComponent,
    StarPickerMobileInputComponent,
    LikertPickerMobileInputComponent
  ],
  entryComponents: [
    LockConfigurationSheetComponent,
    NewTrackingPlanDialogComponent,
    FieldPresetPickerComponent,
    TrackerPickerComponent,
    TrackerColorPickerComponent,
    FactoryListComponent
  ]
})
export class TrackingPlanModule {}
