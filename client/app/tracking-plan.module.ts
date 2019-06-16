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
    DayOfWeekCheckerComponent
  ],
  entryComponents: [
    LockConfigurationSheetComponent,
    NewTrackingPlanDialogComponent,
  ]
})
export class TrackingPlanModule {}