import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import { OAuthModule } from 'angular-oauth2-oidc';

import { RoutingModule } from './routing.module';
import { SharedModule } from './shared/shared.module';

import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { AppComponent } from './app.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { ResearchMainComponent } from './research-main/research-main.component';
import { ResearchLoginComponent } from './research-login/research-login.component';
import { ResearchSignupComponent } from './research-signup/research-signup.component';
import { ResearchFrameComponent } from './research-frame/research-frame.component';
import { ResearcherAuthService } from './services/researcher.auth.service';
import { ResearchDashboardComponent } from './research-dashboard/research-dashboard.component';
import { ResearcherAuthGuardSecure } from './services/researcher.auth.guard.secure';
import { ResearcherAuthGuardMain } from './services/researcher.auth.guard.main';
import { ResearchApiService } from './services/research-api.service';
import { ExperimentOverviewComponent } from './experiment-overview/experiment-overview.component';
import { ExperimentParticipantsComponent } from './experiment-participants/experiment-participants.component';
import { ExperimentGroupsComponent } from './experiment-groups/experiment-groups.component';
import { ExperimentOmniTrackComponent } from './experiment-omnitrack/experiment-omnitrack.component';
import { ExperimentInvitationsComponent } from './experiment-invitations/experiment-invitations.component';
import { ExperimentSettingsComponent } from './experiment-settings/experiment-settings.component';
import { ExperimentDataComponent } from './experiment-data/experiment-data.component';
import { OmniTrackPackageListComponent } from './research/omnitrack/omnitrack-package-list.component';
import { OmniTrackPackageEditComponent } from './research/omnitrack/omnitrack-package-edit.component';
import { MaterialDesignModule } from './material-design.module';
import { YesNoDialogComponent } from './dialogs/yes-no-dialog/yes-no-dialog.component';
import { NewInvitationDialogComponent } from './experiment-invitations/new-invitation-dialog/new-invitation-dialog.component';
import { BusyOverlayComponent } from './busy-overlay/busy-overlay.component';
import { ChooseInvitationDialogComponent } from './dialogs/choose-invitation-dialog/choose-invitation-dialog.component';
import { ExperimentMessagingComponent } from './experiment-messaging/experiment-messaging.component';
import { ComposeMessageComponent } from './experiment-messaging/compose-message/compose-message.component';


@NgModule({
  declarations: [
    AppComponent,
    NotFoundComponent,
    ResearchMainComponent,
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
    YesNoDialogComponent,
    NewInvitationDialogComponent,
    BusyOverlayComponent,
    ChooseInvitationDialogComponent,
    ExperimentMessagingComponent,
    ComposeMessageComponent
  ],
  imports: [
    OAuthModule.forRoot(),
    RoutingModule,
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    MaterialDesignModule
  ],
  providers: [
    ResearcherAuthGuardSecure,
    ResearcherAuthGuardMain,
    ResearcherAuthService,
    ResearchApiService
    /*AuthService,
    CatService,
    UserService*/
  ],
  entryComponents: [
    YesNoDialogComponent,
    ChooseInvitationDialogComponent,
    NewInvitationDialogComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})

export class AppModule { }
