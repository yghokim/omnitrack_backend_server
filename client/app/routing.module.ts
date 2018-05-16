import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { NotFoundComponent } from './not-found/not-found.component';

import { ResearchMainComponent } from './research-main/research-main.component';
import { ResearchSignupComponent } from './research-signup/research-signup.component';
import { ResearchLoginComponent } from './research-login/research-login.component';
import { ResearchFrameComponent } from './research-frame/research-frame.component';
import { ResearcherAuthGuardMain } from './services/researcher.auth.guard.main';
import { ResearchDashboardComponent } from './research-dashboard/research-dashboard.component';
import { ResearcherAuthGuardSecure } from './services/researcher.auth.guard.secure';
import { ExperimentOverviewComponent } from './experiment-overview/experiment-overview.component';
import { ExperimentDataComponent } from './experiment-data/experiment-data.component';
import { ExperimentParticipantsComponent } from './experiment-participants/experiment-participants.component';
import { ExperimentGroupsComponent } from './experiment-groups/experiment-groups.component';
import { ExperimentOmniTrackComponent } from './experiment-omnitrack/experiment-omnitrack.component';
import { ExperimentInvitationsComponent } from './experiment-invitations/experiment-invitations.component';
import { ExperimentSettingsComponent } from './experiment-settings/experiment-settings.component';
import { OmniTrackPackageListComponent } from './research/omnitrack/omnitrack-package-list.component';
import { OmniTrackPackageEditComponent } from './research/omnitrack/omnitrack-package-edit.component';
import { ExperimentMessagingComponent } from './experiment-messaging/experiment-messaging.component';
import { ComposeMessageComponent } from './experiment-messaging/compose-message/compose-message.component';
import { ResearchHomeFrameComponent } from './research-home-frame/research-home-frame.component';
import { ExperimentListComponent } from './experiment-list/experiment-list.component';
import { ResearcherAccountSettingsComponent } from './researcher-account-settings/researcher-account-settings.component';
import { ServerSettingsComponent } from './server-settings/server-settings.component';
import { ClientDownloadComponent } from './client-download/client-download.component';
import { EndUserFrameComponent } from './end-user/end-user-frame/end-user-frame.component';
import { EndUserHomeComponent } from './end-user/end-user-home/end-user-home.component';
import { EndUserSignInComponent } from './end-user/end-user-sign-in/end-user-sign-in.component';
import { EndUserAuthCheckGuard } from './end-user/services/end-user-auth-check.guard';
import { EndUserAuthToMainGuard } from './end-user/services/end-user-auth-to-main.guard';
import { EndUserDashboardComponent } from './end-user/end-user-dashboard/end-user-dashboard.component';
import { EndUserTrackerListComponent } from './end-user/end-user-tracker-list/end-user-tracker-list.component';
import { EndUserTriggerListComponent } from './end-user/end-user-trigger-list/end-user-trigger-list.component';
import { PerParticipantVisualizationDashboardComponent } from './research/visualization/per-participant-visualization-dashboard/per-participant-visualization-dashboard.component';
import { ExperimentCustomStatisticsComponent } from './experiment-custom-statistics/experiment-custom-statistics.component';
import { ExperimentTrackingEngagementComponent } from './experiment-overview/experiment-tracking-engagement/experiment-tracking-engagement.component';
import { ClientUsageComponent } from './experiment-overview/client-usage/client-usage.component';

const routes: Routes = [
  { path: '', redirectTo: 'downloads', pathMatch: 'full', canActivate: [EndUserAuthToMainGuard] },
  { path: 'downloads', component: ClientDownloadComponent },

  {
    path: 'tracking', component: EndUserFrameComponent,
    children: [
      {
        path: '', component: EndUserHomeComponent, canActivate: [EndUserAuthCheckGuard], data: { title: "OmniTrack" },
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: EndUserDashboardComponent },
          { path: 'trackers', component: EndUserTrackerListComponent },
          { path: 'triggers', component: EndUserTriggerListComponent }
        ]
      },
      { path: 'login', component: EndUserSignInComponent, canActivate: [EndUserAuthToMainGuard], data: { title: "Login" } }
    ]
  },

  {
    path: 'research', component: ResearchFrameComponent,
    children: [
      {
        path: '', component: ResearchHomeFrameComponent,
        children: [
          { path: '', component: ResearchMainComponent, canActivate: [ResearcherAuthGuardMain] },
          { path: 'settings', component: ServerSettingsComponent, canActivate: [ResearcherAuthGuardSecure] },
          { path: 'signup', component: ResearchSignupComponent },
          { path: 'login', component: ResearchLoginComponent },
          { path: 'experiments', component: ExperimentListComponent, canActivate: [ResearcherAuthGuardSecure] },
          { path: 'account', component: ResearcherAccountSettingsComponent, canActivate: [ResearcherAuthGuardSecure] }
        ]
      },
      { path: 'dashboard', component: ResearchDashboardComponent, canActivate: [ResearcherAuthGuardSecure] },
      {
        path: 'dashboard/:experimentId', component: ResearchDashboardComponent, canActivate: [ResearcherAuthGuardSecure],
        children: [
          { path: '', redirectTo: 'overview', pathMatch: "full" },
          { 
            path: 'overview', component: ExperimentOverviewComponent, data: { title: 'Overview', showTitleBar: false },
            children: [
              {path: '', redirectTo: 'tracking', pathMatch: 'full'},
              {path: 'tracking', component: ExperimentTrackingEngagementComponent},
              {path: 'usage', component: ClientUsageComponent}

            ] 
          },
          { path: 'detailed-overview', component: PerParticipantVisualizationDashboardComponent, data: { title: 'Per-participant Overview' } },
          {
            path: 'custom-statistics', component: ExperimentCustomStatisticsComponent, data: { title: 'Custom Statistics' }
          },
          { path: 'messaging', component: ExperimentMessagingComponent, data: { title: "Messaging" } },
          { path: 'messaging/new', component: ComposeMessageComponent, data: { title: "Compose Message", backTitle: "Messaging", backNavigationUrl: './messaging' } },
          { path: 'tracking-data', component: ExperimentDataComponent, data: { title: 'Tracking Data' } },
          { path: 'participants', component: ExperimentParticipantsComponent, data: { title: 'Participants' } },
          { path: 'groups', component: ExperimentGroupsComponent, data: { title: 'Groups' } },
          { path: 'invitations', component: ExperimentInvitationsComponent, data: { title: 'Invitations' } },
          { path: 'settings', component: ExperimentSettingsComponent, data: { title: 'Settings' } },
          {
            path: 'omnitrack', component: ExperimentOmniTrackComponent, data: { title: 'OmniTrack' },
            children: [
              { path: '', redirectTo: 'packages', pathMatch: 'full' },
              { path: 'packages', component: OmniTrackPackageListComponent, data: { title: "OmniTrack Packages" } },
              { path: 'packages/:packageKey', component: OmniTrackPackageEditComponent, data: { title: "Edit Tracking Package" } }
            ]
          },

        ]
      }
    ]
  },

  /*
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'logout', component: LogoutComponent },
  { path: 'account', component: AccountComponent},
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuardAdmin] },*/
  { path: 'notfound', component: NotFoundComponent },
  { path: '**', redirectTo: '/notfound' },
];



@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class RoutingModule { }
