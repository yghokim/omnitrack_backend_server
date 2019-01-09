import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import { RoutingModule } from './routing.module';
import { SharedModule } from './shared/shared.module';

import { AppComponent } from './app.component';
import { NotFoundComponent } from './not-found/not-found.component';

import { MaterialDesignModule } from './material-design.module';
import { YesNoDialogComponent } from './dialogs/yes-no-dialog/yes-no-dialog.component';

import { ResearchModule } from './research.module';
import { TextInputDialogComponent } from './dialogs/text-input-dialog/text-input-dialog.component';
import { ImageViewDialog } from './experiment-data/image-cell/image-view-dialog/image-view-dialog.component';
import { PlatformVersionCheckService } from './services/platform-version-check.service';
import { NotifierModule, NotifierService } from 'angular-notifier';
import { BackendNotRespondComponent } from './errors/backend-not-respond/backend-not-respond.component';

@NgModule({
  declarations: [
    AppComponent,
    NotFoundComponent,
    YesNoDialogComponent,
    TextInputDialogComponent,
    ImageViewDialog,
    BackendNotRespondComponent
  ],
  imports: [
    RoutingModule,
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    MaterialDesignModule,
    ResearchModule,
    
    NotifierModule.withConfig({
      position:{
        horizontal: {
          distance: 24,
          position: 'right'
        },
        vertical: {
          distance: 64,
          position: 'top'
        }
      }
    })
  ],
  providers: [
    PlatformVersionCheckService,
    NotifierService
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
