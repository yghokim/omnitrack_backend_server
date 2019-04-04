import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { ExperimentOverviewComponent } from "./experiment-overview/experiment-overview.component";
import { ExperimentTrackingEngagementComponent } from "./experiment-overview/experiment-tracking-engagement/experiment-tracking-engagement.component";
import { ClientUsageComponent } from "./experiment-overview/client-usage/client-usage.component";
import { ExperimentMessagingComponent } from "./experiment-messaging/experiment-messaging.component";
import { ComposeMessageComponent } from "./experiment-messaging/compose-message/compose-message.component";
import { ExperimentDataComponent } from "./experiment-data/experiment-data.component";
import { ExperimentTrackingEntityStatusComponent } from "./experiment-tracking-entity-status/experiment-tracking-entity-status.component";

import { ExperimentParticipantsComponent } from "./experiment-participants/experiment-participants.component";
import { ExperimentGroupsComponent } from "./experiment-groups/experiment-groups.component";
import { ExperimentInvitationsComponent } from "./experiment-invitations/experiment-invitations.component";
import { ExperimentClientSettingsComponent } from "./experiment-client-settings/experiment-client-settings.component";
import { ExperimentSettingsComponent } from "./experiment-settings/experiment-settings.component";
import { ExperimentConsentComponent } from "./experiment-consent/experiment-consent.component";
import { ExperimentConsentEditorComponent } from "./experiment-consent-editor/experiment-consent-editor.component";
import { DemographicEditorComponent } from "./experiment-consent/demographic-editor/demographic-editor.component";
import { ExperimentOmniTrackComponent } from "./experiment-omnitrack/experiment-omnitrack.component";
import { OmniTrackPackageListComponent } from "./research/omnitrack/omnitrack-package-list.component";
import { OmniTrackPackageCodeEditorComponent } from "./research/omnitrack/omni-track-package-code-editor/omni-track-package-code-editor.component";
import { CommonModule } from "@angular/common";
import { SharedModule } from "./shared/shared.module";
import { ResearchDashboardComponent } from "./research-dashboard/research-dashboard.component";
import { OmniTrackPackageEditComponent } from "./research/omnitrack/omnitrack-package-edit.component";
import { NouisliderModule } from "ng2-nouislider";
import { MonacoEditorModule } from "ngx-monaco-editor";
import { ResearchSharedModule } from './research-shared.module';
import { NewInvitationDialogComponent } from "./experiment-invitations/new-invitation-dialog/new-invitation-dialog.component";
import { ChooseInvitationDialogComponent } from "./dialogs/choose-invitation-dialog/choose-invitation-dialog.component";
import { EditExperimentGroupDialogComponent } from "./experiment-groups/edit-experiment-group-dialog/edit-experiment-group-dialog.component";
import { LockConfigurationSheetComponent } from "./research/omnitrack/entities/lock-flag-button/lock-configuration-sheet/lock-configuration-sheet.component";
import { NewTrackingPackageDialogComponent } from "./research/omnitrack/new-tracking-package-dialog/new-tracking-package-dialog.component";
import { ParticipantExcludedDaysConfigDialogComponent } from "./dialogs/participant-excluded-days-config-dialog/participant-excluded-days-config-dialog.component";
import { UpdateItemCellValueDialogComponent } from "./dialogs/update-item-cell-value-dialog/update-item-cell-value-dialog.component";
import { LocationCellComponent } from "./experiment-data/location-cell/location-cell.component";
import { MinuteSecondsPipe, AudioCellComponent } from "./experiment-data/audio-cell/audio-cell.component";
import { ImageCellComponent } from "./experiment-data/image-cell/image-cell.component";
import { EngagementComponent } from "./research/visualization/engagement/engagement.component";
import { TrackingDataSynchronizerWidgetComponent } from "./research/tracking-data-synchronizer-widget/tracking-data-synchronizer-widget.component";
import { ExperimentDataSummaryComponent } from "./research/visualization/experiment-data-summary/experiment-data-summary.component";
import { TrackerViewComponent } from "./research/omnitrack/entities/tracker-view/tracker-view.component";
import { TriggerViewComponent } from "./research/omnitrack/entities/trigger-view/trigger-view.component";
import { LockFlagButtonComponent } from "./research/omnitrack/entities/lock-flag-button/lock-flag-button.component";
import { TrackerTreeViewComponent } from "./research/omnitrack/entities/tracker-tree-view/tracker-tree-view.component";
import { TriggerTreeViewComponent } from "./research/omnitrack/entities/trigger-tree-view/trigger-tree-view.component";
import { ItemFieldInputComponent } from "./components/item-field-input/item-field-input.component";
import { GeneralItemFieldInputComponent } from "./components/field-inputs/general-item-field-input/general-item-field-input.component";
import { TimePointFieldInputComponent } from "./components/field-inputs/time-point-field-input/time-point-field-input.component";
import { TextFieldInputComponent } from "./components/field-inputs/text-field-input/text-field-input.component";
import { ChoiceFieldInputComponent } from "./components/field-inputs/choice-field-input/choice-field-input.component";
import { TableCellValueComponent } from "./components/table-cell-value/table-cell-value.component";
import { TreeViewElementComponent } from "./components/tree-view-element/tree-view-element.component";
import { ResearcherSearchComponent } from "./experiment-settings/researcher-search/researcher-search.component";

const routes: Routes = [
  {
    path: "", component: ResearchDashboardComponent,
    children: [
      { path: "", redirectTo: "overview", pathMatch: "full" },
      {
        path: "overview",
        component: ExperimentOverviewComponent,
        data: { title: "Overview", showTitleBar: false },
        children: [
          { path: "", redirectTo: "tracking", pathMatch: "full" },
          { path: "tracking", component: ExperimentTrackingEngagementComponent },
          { path: "usage", component: ClientUsageComponent }
        ]
      },
      {
        path: "messaging",
        component: ExperimentMessagingComponent,
        data: { title: "Messaging" }
      },
      {
        path: "messaging/new",
        component: ComposeMessageComponent,
        data: {
          title: "Compose Message",
          backTitle: "Messaging",
          backNavigationUrl: "./messaging"
        }
      },
      {
        path: "tracking-data",
        component: ExperimentDataComponent,
        data: { title: "Captured Items" }
      },
      {
        path: "entity-status",
        component: ExperimentTrackingEntityStatusComponent,
        data: { title: "Tracking Entity Status" }
      },
      {
        path: "participants",
        component: ExperimentParticipantsComponent,
        data: { title: "Participants" }
      },
      {
        path: "groups",
        component: ExperimentGroupsComponent,
        data: { title: "Groups" }
      },
      {
        path: "invitations",
        component: ExperimentInvitationsComponent,
        data: { title: "Invitations" }
      },
      {
        path: "study-apps",
        component: ExperimentClientSettingsComponent,
        data: { title: "Study Apps" }
      },
      {
        path: "settings",
        component: ExperimentSettingsComponent,
        data: { title: "Settings" }
      },
      {
        path: "consent",
        component: ExperimentConsentComponent,
        data: { title: "Configure Informed Consent" }
      },
      {
        path: "consent/edit",
        component: ExperimentConsentEditorComponent,
        data: {
          title: "Edit Consent Form",
          backTitle: "Experiment Settings",
          backNavigationUrl: "./consent"
        }
      },
      {
        path: "consent/demographic",
        component: DemographicEditorComponent,
        data: {
          title: "Edit Demographic Questionnaires",
          backTitle: "Informed Consent Configuration",
          backNavigationUrl: "./consent"
        }
      },
      {
        path: "omnitrack",
        component: ExperimentOmniTrackComponent,
        data: { title: "OmniTrack" },
        children: [
          { path: "", redirectTo: "packages", pathMatch: "full" },
          {
            path: "packages",
            component: OmniTrackPackageListComponent,
            data: { title: "OmniTrack Packages" }
          },
          {
            path: "packages/:packageKey",
            component: OmniTrackPackageCodeEditorComponent,
            data: {
              title: "Edit Tracking Package Code",
              backTitle: "Package List",
              backNavigationUrl: "./omnitrack/packages"
            }
          }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [
    CommonModule, 
    SharedModule,
    ResearchSharedModule,
    RouterModule.forChild(routes),
    NouisliderModule,
    MonacoEditorModule.forRoot(),
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    ResearchDashboardComponent,
    ExperimentOverviewComponent,
    ExperimentTrackingEngagementComponent,
    ClientUsageComponent,
    ExperimentParticipantsComponent,
    ExperimentGroupsComponent,
    ExperimentOmniTrackComponent,
    ExperimentInvitationsComponent,
    ExperimentSettingsComponent,
    ExperimentDataComponent,
    ExperimentMessagingComponent,
    ComposeMessageComponent,
    ExperimentTrackingEntityStatusComponent,
    ExperimentClientSettingsComponent,
    OmniTrackPackageListComponent,
    OmniTrackPackageEditComponent,
    ExperimentConsentComponent,
    ExperimentConsentEditorComponent,
    DemographicEditorComponent,
    OmniTrackPackageCodeEditorComponent,
    LockConfigurationSheetComponent,

    ResearcherSearchComponent,
    
    NewInvitationDialogComponent,
    ChooseInvitationDialogComponent,
    EditExperimentGroupDialogComponent,
    NewTrackingPackageDialogComponent,
    ParticipantExcludedDaysConfigDialogComponent,
    UpdateItemCellValueDialogComponent,

    EngagementComponent,
    TrackingDataSynchronizerWidgetComponent,
    ExperimentDataSummaryComponent,
    TrackerViewComponent,
    TriggerViewComponent,
    LockFlagButtonComponent,
    TrackerTreeViewComponent,
    TriggerTreeViewComponent,

    TreeViewElementComponent,
    
    ItemFieldInputComponent,
    GeneralItemFieldInputComponent,
    TimePointFieldInputComponent,
    TextFieldInputComponent,
    ChoiceFieldInputComponent,
      
    TableCellValueComponent,
  
    LocationCellComponent,
    MinuteSecondsPipe,
    AudioCellComponent,
    ImageCellComponent,
  ],
  entryComponents: [
    NewInvitationDialogComponent,
    ChooseInvitationDialogComponent,
    EditExperimentGroupDialogComponent,
    NewTrackingPackageDialogComponent,
    ParticipantExcludedDaysConfigDialogComponent,
    UpdateItemCellValueDialogComponent,
    LockConfigurationSheetComponent
  ]
})
export class ExperimentDashboardModule { }
