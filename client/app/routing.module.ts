import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { CatsComponent } from './cats/cats.component';
import { AboutComponent } from './about/about.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { AccountComponent } from './account/account.component';
import { AdminComponent } from './admin/admin.component';
import { NotFoundComponent } from './not-found/not-found.component';

import { AuthGuardAdmin } from './services/auth-guard-admin.service';
import { ResearchMainComponent } from './research-main/research-main.component';
import { ResearchSignupComponent } from './research-signup/research-signup.component';
import { ResearchLoginComponent } from './research-login/research-login.component';
import { ResearchFrameComponent } from './research-frame/research-frame.component';
import { ResearcherAuthGuardMain } from './services/researcher.auth.guard.main';
import { ResearchDashboardComponent } from './research-dashboard/research-dashboard.component';
import { ResearcherAuthGuardSecure } from './services/researcher.auth.guard.secure';

const routes: Routes = [
  { path: '', component: AboutComponent },
  { path: 'research', component: ResearchFrameComponent,
    children: [
      { path: '', component: ResearchMainComponent, canActivate: [ResearcherAuthGuardMain]},
      { path: 'dashboard', component: ResearchDashboardComponent, canActivate: [ResearcherAuthGuardSecure] },
      { path: 'signup', component: ResearchSignupComponent, canActivate: [ResearcherAuthGuardMain] },
      { path: 'login', component: ResearchLoginComponent, canActivate: [ResearcherAuthGuardMain] },
    ]
  },
  
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'logout', component: LogoutComponent },
  { path: 'account', component: AccountComponent},
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuardAdmin] },
  { path: 'notfound', component: NotFoundComponent },
  { path: '**', redirectTo: '/notfound' },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})

export class RoutingModule {}
