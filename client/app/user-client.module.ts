import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from './shared/shared.module';
import { UserClientFrameComponent } from './user/user-client-frame/user-client-frame.component';
import { UserPasswordResetComponent } from './user/user-password-reset/user-password-reset.component';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '', component: UserClientFrameComponent,
    children: [
      {
        path: 'reset_password',
        component: UserPasswordResetComponent 
      }
    ]
  }
]

@NgModule({
  declarations: [
    UserClientFrameComponent,
    UserPasswordResetComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes),
  ]
})
export class UserClientModule { }
