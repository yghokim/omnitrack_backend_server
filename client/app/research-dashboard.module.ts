import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ResearcherAuthGuardSecure } from './services/researcher.auth.guard.secure';
import { ResearcherAuthGuardMain } from './services/researcher.auth.guard.main';
import { SocketService } from './services/socket.service';
import { ResearchApiService } from './services/research-api.service';
import { ResearchHomeFrameComponent } from './research-home-frame/research-home-frame.component';
import { ServerStatusOverviewComponent } from './server-status-overview/server-status-overview.component';
import { ServerSettingsComponent } from './server-settings/server-settings.component';
import { ResearchSignupComponent } from './research-signup/research-signup.component';
import { ResearchLoginComponent } from './research-login/research-login.component';
import { ExperimentListComponent } from './experiment-list/experiment-list.component';
import { ResearcherAccountSettingsComponent } from './researcher-account-settings/researcher-account-settings.component';
import { ClientDownloadComponent } from './client-download/client-download.component';
import { ResearcherPermissionsConfigurationComponent } from './experiment-settings/researcher-permissions-configuration/researcher-permissions-configuration.component';
import { NewExperimentDialogComponent } from './experiment-list/new-experiment-dialog/new-experiment-dialog.component';
import { DeleteExperimentConfirmDialogComponent } from './dialogs/delete-experiment-confirm-dialog/delete-experiment-confirm-dialog.component';
import { UploadClientBinaryDialogComponent } from './server-settings/upload-client-binary-dialog/upload-client-binary-dialog.component';
import { DailyAverageComponent } from './experiment-overview/client-usage/daily-average/daily-average.component';
import { UpdateClientSignatureDialogComponent } from './server-settings/update-client-signature-dialog/update-client-signature-dialog.component';
import { UsersPerDayComponent } from './server-status-overview/users-per-day/users-per-day.component';
import { DevicesPerDayComponent } from './server-status-overview/devices-per-day/devices-per-day.component';
import { ServerUserListComponent } from './server-status-overview/server-user-list/server-user-list.component';
import { SignatureValidationCompleteDialogComponent } from './experiment-client-settings/platform-config-panel/signature-validation-complete-dialog/signature-validation-complete-dialog.component';
import { CreateNewJavaKeystoreDialogComponent } from './experiment-client-settings/platform-config-panel/create-new-java-keystore-dialog/create-new-java-keystore-dialog.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from './shared/shared.module';
import { NotificationService } from './services/notification.service';
import { ResearchFrameComponent } from './research-frame/research-frame.component';
import { ResearchSharedModule } from './research-shared.module';
import { StatAnalyticsComponent } from './server-status-overview/stat-analytics/stat-analytics.component';
import { ClientCrashLogsComponent } from './server-status-overview/client-crash-logs/client-crash-logs.component';
import { TextClipboardPastedBottomSheetComponent } from './components/text-clipboard-pasted-bottom-sheet/text-clipboard-pasted-bottom-sheet.component';
import { FileDropModule } from 'ngx-file-drop';

const routes: Routes = [
  {
    path: '', component: ResearchFrameComponent,
    children: [
      {
        path: '', component: ResearchHomeFrameComponent,
        children: [
          { path: '', redirectTo: 'experiments', pathMatch: 'full' },
          { path: 'status', component: ServerStatusOverviewComponent, canActivate: [ResearcherAuthGuardSecure] },
          { path: 'settings', component: ServerSettingsComponent, canActivate: [ResearcherAuthGuardSecure] },
          { path: 'signup', component: ResearchSignupComponent },
          { path: 'login', component: ResearchLoginComponent },
          { path: 'experiments', component: ExperimentListComponent, canActivate: [ResearcherAuthGuardSecure] },
          { path: 'account', component: ResearcherAccountSettingsComponent, canActivate: [ResearcherAuthGuardSecure] }
        ]
      },
      {
        path: 'dashboard/:experimentId', 
        canLoad: [ResearcherAuthGuardSecure],
        loadChildren: './experiment-dashboard.module#ExperimentDashboardModule'
      }
    ]
  }
]


@NgModule({
  imports:[
    CommonModule,
    SharedModule,
    ResearchSharedModule,
    RouterModule.forChild(routes),
    FileDropModule
  ],
  providers:[
    ResearcherAuthGuardSecure,
    ResearcherAuthGuardMain,
    SocketService,
    ResearchApiService,
    NotificationService,
  ],

  declarations: [
    ResearchFrameComponent,
    ClientDownloadComponent,
    ResearchLoginComponent,
    ResearchSignupComponent,
    ResearchHomeFrameComponent,
    ExperimentListComponent,
    ResearcherAccountSettingsComponent,
    ServerSettingsComponent,
    ServerStatusOverviewComponent,
    ServerUserListComponent,

    StatAnalyticsComponent,
    DailyAverageComponent,
    UsersPerDayComponent,
    DevicesPerDayComponent,
    ClientCrashLogsComponent,
        
    ResearcherPermissionsConfigurationComponent,
    
    NewExperimentDialogComponent,
    DeleteExperimentConfirmDialogComponent,
    SignatureValidationCompleteDialogComponent,
    CreateNewJavaKeystoreDialogComponent,
    UpdateClientSignatureDialogComponent,
    UploadClientBinaryDialogComponent,

    TextClipboardPastedBottomSheetComponent,
  ],

  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    NewExperimentDialogComponent,
    DeleteExperimentConfirmDialogComponent,
    UploadClientBinaryDialogComponent,
    UpdateClientSignatureDialogComponent,
    SignatureValidationCompleteDialogComponent,
    CreateNewJavaKeystoreDialogComponent,
    TextClipboardPastedBottomSheetComponent
  ]
})

export class ResearchDashboardModule { }