import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ResearchLoginComponent } from './research-login/research-login.component';
import { ResearchSignupComponent } from './research-signup/research-signup.component';
import { ResearchFrameComponent } from './research-frame/research-frame.component';
import { ResearcherAuthService } from './services/researcher.auth.service';
import { ResearchDashboardComponent } from './research-dashboard/research-dashboard.component';
import { ResearcherAuthGuardSecure } from './services/researcher.auth.guard.secure';
import { ResearcherAuthGuardMain } from './services/researcher.auth.guard.main';
import { ResearchApiService } from './services/research-api.service';
import { ExperimentOverviewComponent } from './experiment-overview/experiment-overview.component';
import { ClientDownloadComponent } from './client-download/client-download.component';
import { ExperimentParticipantsComponent } from './experiment-participants/experiment-participants.component';
import { ExperimentGroupsComponent } from './experiment-groups/experiment-groups.component';
import { ExperimentOmniTrackComponent } from './experiment-omnitrack/experiment-omnitrack.component';
import { ExperimentInvitationsComponent } from './experiment-invitations/experiment-invitations.component';
import { ExperimentSettingsComponent } from './experiment-settings/experiment-settings.component';
import { ExperimentDataComponent } from './experiment-data/experiment-data.component';
import { OmniTrackPackageListComponent } from './research/omnitrack/omnitrack-package-list.component';
import { OmniTrackPackageEditComponent } from './research/omnitrack/omnitrack-package-edit.component';
import { NewInvitationDialogComponent } from './experiment-invitations/new-invitation-dialog/new-invitation-dialog.component';
import { ChooseInvitationDialogComponent } from './dialogs/choose-invitation-dialog/choose-invitation-dialog.component';
import { ExperimentMessagingComponent } from './experiment-messaging/experiment-messaging.component';
import { ComposeMessageComponent } from './experiment-messaging/compose-message/compose-message.component';
import { AnonymizeEmailPipe } from './pipes/anonymize-email.pipe';
import { SocketService } from './services/socket.service';
import { RoutingModule } from './routing.module';
import { SharedModule } from './shared/shared.module';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { ResearcherPermissionsConfigurationComponent } from './experiment-settings/researcher-permissions-configuration/researcher-permissions-configuration.component';
import { ResearcherSearchComponentComponent } from './experiment-settings/researcher-search-component/researcher-search-component.component';
import { ResearchLayoutComponent } from './layouts/research-layout/research-layout.component';
import { ResearchHomeFrameComponent } from './research-home-frame/research-home-frame.component';
import { ExperimentListComponent } from './experiment-list/experiment-list.component';
import { ResearcherAccountSettingsComponent } from './researcher-account-settings/researcher-account-settings.component';
import { EngagementComponent } from './research/visualization/engagement/engagement.component';
import { EngagementTimelineContainerDirective } from './research/visualization/engagement/engagement-timeline-container.directive';
import { SVGEllipsisDirective } from './directives/svgellipsis.directive';
import { NouisliderModule, NouisliderComponent } from 'ng2-nouislider';
import { NewExperimentDialogComponent } from './experiment-list/new-experiment-dialog/new-experiment-dialog.component';
import { EngagementParticipantGroupDirective } from './research/visualization/engagement/engagement-participant-group.directive';
import { DeleteExperimentConfirmDialogComponent } from './dialogs/delete-experiment-confirm-dialog/delete-experiment-confirm-dialog.component';
import { TableCellValueComponent } from './components/table-cell-value/table-cell-value.component';
import { ServerSettingsComponent } from './server-settings/server-settings.component';
import { UploadClientBinaryDialogComponent } from './server-settings/upload-client-binary-dialog/upload-client-binary-dialog.component';
import { ImageCellComponent } from './experiment-data/image-cell/image-cell.component';
import { PerParticipantVisualizationDashboardComponent } from './research/visualization/per-participant-visualization-dashboard/per-participant-visualization-dashboard.component';
import { TrackingDataSynchronizerWidgetComponent } from './research/tracking-data-synchronizer-widget/tracking-data-synchronizer-widget.component';
import { AudioCellComponent, MinuteSecondsPipe } from './experiment-data/audio-cell/audio-cell.component';
import { ExperimentDataSummaryComponent } from './research/visualization/experiment-data-summary/experiment-data-summary.component';

import { ExperimentCustomStatisticsComponent } from './experiment-custom-statistics/experiment-custom-statistics.component';


import { UpdateItemCellValueDialogComponent } from './dialogs/update-item-cell-value-dialog/update-item-cell-value-dialog.component';

import { ParticipantExcludedDaysConfigDialogComponent } from './dialogs/participant-excluded-days-config-dialog/participant-excluded-days-config-dialog.component';

import { ProductivityStatisticsModule } from './research/custom/productivity-statistics/productivity-statistics.module';
import { ExperimentTrackingEngagementComponent } from './experiment-overview/experiment-tracking-engagement/experiment-tracking-engagement.component';
import { ClientUsageComponent } from './experiment-overview/client-usage/client-usage.component';
import { DailyAverageComponent } from './experiment-overview/client-usage/daily-average/daily-average.component';
import { EngagementDataService } from './experiment-overview/client-usage/engagement-data.service';
import { ServerStatusOverviewComponent } from './server-status-overview/server-status-overview.component';
import { UpdateClientSignatureDialogComponent } from './server-settings/update-client-signature-dialog/update-client-signature-dialog.component';
import { NewTrackingPackageDialogComponent } from './research/omnitrack/new-tracking-package-dialog/new-tracking-package-dialog.component';
import { HttpMethodTestingComponent } from './test/http-method-testing/http-method-testing.component';
import { UsersPerDayComponent } from './server-status-overview/users-per-day/users-per-day.component';
import { DevicesPerDayComponent } from './server-status-overview/devices-per-day/devices-per-day.component';
import { InstallationWizardComponent } from './installation/installation-wizard/installation-wizard.component';
import { ServerUserListComponent } from './server-status-overview/server-user-list/server-user-list.component';
import { StatAnalyticsComponent } from './server-status-overview/stat-analytics/stat-analytics.component';
import { OmniTrackPackageCodeEditorComponent } from './research/omnitrack/omni-track-package-code-editor/omni-track-package-code-editor.component';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { ExperimentConsentEditorComponent } from './experiment-consent-editor/experiment-consent-editor.component';
import { EditExperimentGroupDialogComponent } from './experiment-groups/edit-experiment-group-dialog/edit-experiment-group-dialog.component';
import { ExperimentClientSettingsComponent } from './experiment-client-settings/experiment-client-settings.component';
import { ConfigVariableRowComponent } from './experiment-client-settings/config-variable-row/config-variable-row.component';
import { PlatformConfigPanelComponent } from './experiment-client-settings/platform-config-panel/platform-config-panel.component';
import { ClientBinaryListComponent } from './components/client-binary-list/client-binary-list.component';
import { ExperimentConsentComponent } from './experiment-consent/experiment-consent.component';
import { DemographicEditorComponent } from './experiment-consent/demographic-editor/demographic-editor.component';
import { ClientCrashLogsComponent } from './server-status-overview/client-crash-logs/client-crash-logs.component';
import { CheckInstallationGuard } from './services/check-installation.guard';
import { SignatureValidationCompleteDialogComponent } from './experiment-client-settings/platform-config-panel/signature-validation-complete-dialog/signature-validation-complete-dialog.component';
import { CreateNewJavaKeystoreDialogComponent } from './experiment-client-settings/platform-config-panel/create-new-java-keystore-dialog/create-new-java-keystore-dialog.component';
import { TrackerViewComponent } from './research/omnitrack/entities/tracker-view/tracker-view.component';
import { TriggerViewComponent } from './research/omnitrack/entities/trigger-view/trigger-view.component';
import { LockFlagButtonComponent } from './research/omnitrack/entities/lock-flag-button/lock-flag-button.component';
import { LockConfigurationSheetComponent } from './research/omnitrack/entities/lock-flag-button/lock-configuration-sheet/lock-configuration-sheet.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    RoutingModule,
    NouisliderModule,
    MonacoEditorModule.forRoot(),
    ProductivityStatisticsModule,
    NgxJsonViewerModule
  ],
  declarations: [
    ClientDownloadComponent,
    ResearchLoginComponent,
    ResearchSignupComponent,
    ResearchFrameComponent,
    ResearchDashboardComponent,
    ExperimentOverviewComponent,
    ExperimentParticipantsComponent,
    ExperimentGroupsComponent,
    ExperimentOmniTrackComponent,
    ExperimentInvitationsComponent,
    ExperimentSettingsComponent,
    ExperimentDataComponent,
    OmniTrackPackageListComponent,
    OmniTrackPackageEditComponent,
    NewInvitationDialogComponent,
    ChooseInvitationDialogComponent,
    ExperimentMessagingComponent,
    ComposeMessageComponent,
    AnonymizeEmailPipe,
    ResearcherPermissionsConfigurationComponent,
    ResearcherSearchComponentComponent,
    ResearchLayoutComponent,
    ResearchHomeFrameComponent,
    ExperimentListComponent,
    ResearcherAccountSettingsComponent,
    EngagementComponent,
    EngagementTimelineContainerDirective,
    SVGEllipsisDirective,
    NewExperimentDialogComponent,
    EngagementParticipantGroupDirective,
    DeleteExperimentConfirmDialogComponent,
    ServerSettingsComponent,
    UploadClientBinaryDialogComponent,
    ImageCellComponent,
    AudioCellComponent,
    PerParticipantVisualizationDashboardComponent,
    TrackingDataSynchronizerWidgetComponent,
    MinuteSecondsPipe,
    UpdateItemCellValueDialogComponent,
    ParticipantExcludedDaysConfigDialogComponent,
    ExperimentDataSummaryComponent,
    ExperimentCustomStatisticsComponent,
    ExperimentTrackingEngagementComponent,
    ClientUsageComponent,
    DailyAverageComponent,
    ServerStatusOverviewComponent,
    UpdateClientSignatureDialogComponent,
    NewTrackingPackageDialogComponent,
    HttpMethodTestingComponent,
    UsersPerDayComponent,
    DevicesPerDayComponent,
    InstallationWizardComponent,
    ServerUserListComponent,
    StatAnalyticsComponent,
    OmniTrackPackageCodeEditorComponent,
    ExperimentConsentEditorComponent,
    EditExperimentGroupDialogComponent,
    ExperimentClientSettingsComponent,
    ConfigVariableRowComponent,
    PlatformConfigPanelComponent,
    ClientBinaryListComponent,
    ExperimentConsentComponent,
    DemographicEditorComponent,
    ClientCrashLogsComponent,
    SignatureValidationCompleteDialogComponent,
    CreateNewJavaKeystoreDialogComponent,
    TrackerViewComponent,
    TriggerViewComponent,
    LockFlagButtonComponent,
    LockConfigurationSheetComponent
  ],
  exports: [
    NouisliderModule,
    ResearchLoginComponent,
    ResearchSignupComponent,
    ResearchFrameComponent,
    ResearchDashboardComponent,
    ExperimentOverviewComponent,
    ExperimentParticipantsComponent,
    ExperimentGroupsComponent,
    ExperimentOmniTrackComponent,
    ExperimentInvitationsComponent,
    ExperimentSettingsComponent,
    ExperimentDataComponent,
    OmniTrackPackageListComponent,
    OmniTrackPackageEditComponent,
    NewInvitationDialogComponent,
    ChooseInvitationDialogComponent,
    ExperimentMessagingComponent,
    ComposeMessageComponent,
    AnonymizeEmailPipe,
    ResearchLayoutComponent,
    ResearchHomeFrameComponent,
    ResearcherAccountSettingsComponent,
    TrackingDataSynchronizerWidgetComponent,
    ExperimentDataSummaryComponent,
    UpdateItemCellValueDialogComponent,
  ],
  providers: [
    ResearcherAuthGuardSecure,
    ResearcherAuthGuardMain,
    ResearcherAuthService,
    SocketService,
    ResearchApiService,
    CheckInstallationGuard
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    ChooseInvitationDialogComponent,
    NewInvitationDialogComponent,
    NewExperimentDialogComponent,
    DeleteExperimentConfirmDialogComponent,
    UploadClientBinaryDialogComponent,
    UpdateItemCellValueDialogComponent,
    ParticipantExcludedDaysConfigDialogComponent,
    UpdateClientSignatureDialogComponent,
    NewTrackingPackageDialogComponent,
    EditExperimentGroupDialogComponent,
    SignatureValidationCompleteDialogComponent,
    CreateNewJavaKeystoreDialogComponent,
    LockConfigurationSheetComponent
  ]
})
export class ResearchModule { }
