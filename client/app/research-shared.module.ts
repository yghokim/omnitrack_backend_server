import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ResearchLayoutComponent } from './layouts/research-layout/research-layout.component';
import { ResearcherAuthService } from './services/researcher.auth.service';
import { SharedModule } from './shared/shared.module';
import { CommonModule } from '@angular/common';
import { ClientBinaryListComponent } from './components/client-binary-list/client-binary-list.component';
import { PlatformConfigPanelComponent } from './experiment-client-settings/platform-config-panel/platform-config-panel.component';
import { ConfigVariableRowComponent } from './experiment-client-settings/config-variable-row/config-variable-row.component';
import { FileDropModule } from 'ngx-file-drop';
import { ClipboardModule } from 'ngx-clipboard';


@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    FileDropModule,
    ClipboardModule
  ],
  declarations: [
    ResearchLayoutComponent,
    ClientBinaryListComponent,
    PlatformConfigPanelComponent,
    ConfigVariableRowComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [
    FileDropModule,
    ClipboardModule,

    ResearchLayoutComponent,
    ClientBinaryListComponent,
    PlatformConfigPanelComponent,
    ConfigVariableRowComponent,
  ],
  providers:[
    ResearcherAuthService]
})
export class ResearchSharedModule { }