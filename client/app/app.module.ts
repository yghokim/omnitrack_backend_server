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

import { NotificationService } from './services/notification.service';

import { ResearchModule } from './research.module';
import { TextInputDialogComponent } from './dialogs/text-input-dialog/text-input-dialog.component';
import { EndUserModule } from './end-user.module';
import { ImageViewDialog } from './experiment-data/image-cell/image-view-dialog/image-view-dialog.component';


@NgModule({
  declarations: [
    AppComponent,
    NotFoundComponent,
    YesNoDialogComponent,
    TextInputDialogComponent,
    ImageViewDialog
  ],
  imports: [
    OAuthModule.forRoot(),
    RoutingModule,
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    MaterialDesignModule,
    ResearchModule,
    EndUserModule
  ],
  providers: [
    NotificationService
  ],
  entryComponents: [
    YesNoDialogComponent,
    TextInputDialogComponent,
    ImageViewDialog
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})

export class AppModule { }
