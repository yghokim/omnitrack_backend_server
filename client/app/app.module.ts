import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { OAuthModule } from 'angular-oauth2-oidc';

import { RoutingModule } from './routing.module';
import { SharedModule } from './shared/shared.module';

import { CatService } from './services/cat.service';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { AppComponent } from './app.component';
import { CatsComponent } from './cats/cats.component';
import { AboutComponent } from './about/about.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { AccountComponent } from './account/account.component';
import { AdminComponent } from './admin/admin.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { ResearchMainComponent } from './research-main/research-main.component';
import { ResearchLoginComponent } from './research-login/research-login.component';
import { ResearchSignupComponent } from './research-signup/research-signup.component';
import { ResearchFrameComponent } from './research-frame/research-frame.component';
import { ResearcherAuthService } from './services/researcher.auth.service';
import { ResearchDashboardComponent } from './research-dashboard/research-dashboard.component';
import { ResearcherAuthGuardSecure } from './services/researcher.auth.guard.secure';
import { ResearcherAuthGuardMain } from './services/researcher.auth.guard.main';


@NgModule({
  declarations: [
    AppComponent,
    CatsComponent,
    AboutComponent,
    RegisterComponent,
    LoginComponent,
    LogoutComponent,
    AccountComponent,
    AdminComponent,
    NotFoundComponent,
    ResearchMainComponent,
    ResearchLoginComponent,
    ResearchSignupComponent,
    ResearchFrameComponent,
    ResearchDashboardComponent
  ],
  imports: [
    NgbModule.forRoot(),
    OAuthModule.forRoot(),
    RoutingModule,
    SharedModule
  ],
  providers: [
    ResearcherAuthGuardSecure,
    ResearcherAuthGuardMain,
    ResearcherAuthService,
    AuthService,
    CatService,
    UserService
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})

export class AppModule { }
