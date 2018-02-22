import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from './shared/shared.module';
import { RoutingModule } from './routing.module';
import { EndUserAuthService } from './end-user/services/end-user-auth.service';
import { EndUserHomeComponent } from './end-user/end-user-home/end-user-home.component';
import { EndUserSignInComponent } from './end-user/end-user-sign-in/end-user-sign-in.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    RoutingModule
  ],
  exports: [

  ],
  declarations: [EndUserHomeComponent, EndUserSignInComponent],
  providers: [EndUserAuthService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: []
})
export class EndUserModule { }
