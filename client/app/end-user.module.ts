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
import { firebase_client_config } from '../../credentials/firebase-client-config';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    MaterialDesignModule,
    RoutingModule,
    AngularFireModule.initializeApp(firebase_client_config),
    AngularFireAuthModule
  ],
  exports: [

  ],
  declarations: [EndUserHomeComponent, EndUserSignInComponent, EndUserFrameComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: []
})
export class EndUserModule { }
