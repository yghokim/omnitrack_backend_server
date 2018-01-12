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

const routes: Routes = [
  { path: '', redirectTo: 'research', pathMatch: 'full' },
  { path: 'research', component: ResearchFrameComponent,
    children: [
      { path: '', component: ResearchHomeFrameComponent,
          children: [
            {path: '', component: ResearchMainComponent, canActivate: [ResearcherAuthGuardMain]},
            {path: 'signup', component: ResearchSignupComponent},
            { path: 'login', component: ResearchLoginComponent},
            { path: 'experiments', component: ExperimentListComponent, canActivate: [ResearcherAuthGuardSecure]} 
          ]
      },
      { path: 'dashboard', component: ResearchDashboardComponent, canActivate: [ResearcherAuthGuardSecure] },
      { path: 'dashboard/:experimentId', component: ResearchDashboardComponent, canActivate: [ResearcherAuthGuardSecure],
        children: [
          { path: '', redirectTo: 'overview', pathMatch: "full"},
          { path: 'overview', component: ExperimentOverviewComponent, data: {title: 'Overview'}},
          { path: 'messaging', component: ExperimentMessagingComponent, data: {title: "Messaging"}},
          { path: 'messaging/new', component: ComposeMessageComponent, data: {title: "Compose Message", backTitle: "Messaging", backNavigationUrl: './messaging'}},
          { path: 'tracking-data', component: ExperimentDataComponent, data: {title: 'Tracking Data'}},
          { path: 'participants', component: ExperimentParticipantsComponent, data: {title: 'Participants'}},
          { path: 'groups', component: ExperimentGroupsComponent, data: {title: 'Groups'}},
          { path: 'invitations', component: ExperimentInvitationsComponent, data: {title: 'Invitations'}},
          { path: 'settings', component: ExperimentSettingsComponent, data: {title: 'Settings'}},
          { path: 'omnitrack', component: ExperimentOmniTrackComponent, data: {title: 'OmniTrack'},
            children: [
              { path: '', redirectTo: 'packages', pathMatch: 'full'},
              { path: 'packages', component: OmniTrackPackageListComponent, data: {title: "OmniTrack Packages"} },
              { path: 'packages/:packageKey', component: OmniTrackPackageEditComponent, data: {title: "Edit Tracking Package"} }
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
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})

export class RoutingModule {}
