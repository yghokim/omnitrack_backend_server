import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { OAuthModule } from 'angular-oauth2-oidc';

import { RoutingModule } from './routing.module';
import { SharedModule } from './shared/shared.module';

import { AppComponent } from './app.component';
import { NotFoundComponent } from './not-found/not-found.component';

import { MaterialDesignModule } from './material-design.module';
import { YesNoDialogComponent } from './dialogs/yes-no-dialog/yes-no-dialog.component';
import { BusyOverlayComponent } from './busy-overlay/busy-overlay.component';
import { ChooseInvitationDialogComponent } from './dialogs/choose-invitation-dialog/choose-invitation-dialog.component';

import { NotificationService } from './services/notification.service';

import { ResearchModule } from './research.module';
import { TextInputDialogComponent } from './dialogs/text-input-dialog/text-input-dialog.component';
import { D3ChartFrameComponent } from './research/visualization/d3-chart-frame/d3-chart-frame.component';
import { SVGEllipsisDirective } from './directives/svgellipsis.directive';
import { TableCellValueComponent } from './components/table-cell-value/table-cell-value.component';

@NgModule({
  declarations: [
    AppComponent,
    NotFoundComponent,
    YesNoDialogComponent,
    TextInputDialogComponent,
    BusyOverlayComponent
  ],
  imports: [
    OAuthModule.forRoot(),
    RoutingModule,
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    MaterialDesignModule,
    ResearchModule,
  ],
  providers: [
    NotificationService
  ],
  entryComponents: [
    YesNoDialogComponent,
    TextInputDialogComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})

export class AppModule { }
