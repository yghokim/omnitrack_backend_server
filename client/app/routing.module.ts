import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './not-found/not-found.component';
import { HttpMethodTestingComponent } from './test/http-method-testing/http-method-testing.component';
import { InstallationWizardComponent } from './installation/installation-wizard/installation-wizard.component';
import { PreventReinstallationGuard } from './services/prevent-reinstallation.guard';
import { ResearchFrameComponent } from './research-frame/research-frame.component';
import { CheckInstallationGuard } from './services/check-installation.guard';
import { BackendNotRespondComponent } from './errors/backend-not-respond/backend-not-respond.component';


const routes: Routes = [
  { path: "", redirectTo: "research", pathMatch: "full" },

  { path: "test", component: HttpMethodTestingComponent },

  {
    path: "install",
    component: InstallationWizardComponent,
    canActivate: [PreventReinstallationGuard]
  },
  /*
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
    },*/

  {
    path: "research",
    canLoad: [CheckInstallationGuard],
    loadChildren: "./research-dashboard.module#ResearchDashboardModule"
  },

  { path: "notfound", component: NotFoundComponent },
  { path: "backend_not_respond", component: BackendNotRespondComponent},
  { path: "**", redirectTo: "/notfound" }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class RoutingModule { }
