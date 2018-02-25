import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from './shared/shared.module';
import { RoutingModule } from './routing.module';
import { EndUserHomeComponent } from './end-user/end-user-home/end-user-home.component';
import { EndUserSignInComponent } from './end-user/end-user-sign-in/end-user-sign-in.component';
import { EndUserFrameComponent } from './end-user/end-user-frame/end-user-frame.component';
import { MaterialDesignModule } from './material-design.module';
import { AngularFireModule } from 'angularfire2';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { firebase } from '../credentials/firebase-client-config';
import { EndUserApiService } from './end-user/services/end-user-api.service';
import { EndUserAuthCheckGuard } from './end-user/services/end-user-auth-check.guard';
import { EndUserAuthToMainGuard } from './end-user/services/end-user-auth-to-main.guard';
import { EndUserDashboardComponent } from './end-user/end-user-dashboard/end-user-dashboard.component';
import { EndUserTrackerListComponent } from './end-user/end-user-tracker-list/end-user-tracker-list.component';
import { EndUserTriggerListComponent } from './end-user/end-user-trigger-list/end-user-trigger-list.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    RoutingModule,
    AngularFireModule.initializeApp(firebase),
    AngularFireAuthModule
  ],
  exports: [

  ],
  declarations: [EndUserHomeComponent, EndUserSignInComponent, EndUserFrameComponent, EndUserDashboardComponent, EndUserTrackerListComponent, EndUserTriggerListComponent],
  providers: [EndUserApiService, EndUserAuthCheckGuard, EndUserAuthToMainGuard],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: []
})
export class EndUserModule { }
