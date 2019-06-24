import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ResearchLayoutComponent } from './layouts/research-layout/research-layout.component';
import { ResearcherAuthService } from './services/researcher.auth.service';
import { SharedModule } from './shared/shared.module';
import { CommonModule } from '@angular/common';
import { ClientBinaryListComponent } from './components/client-binary-list/client-binary-list.component';
import { PlatformConfigPanelComponent } from './experiment-client-settings/platform-config-panel/platform-config-panel.component';
import { ConfigVariableRowComponent } from './experiment-client-settings/config-variable-row/config-variable-row.component';
import { ClipboardModule } from 'ngx-clipboard';
import { C3ChartComponent } from './research/visualization/c3-chart.component';
import { ChartFrameComponent } from './shared-visualization/chart-frame/chart-frame.component';
import { D3ChartFrameComponent } from './shared-visualization/d3-chart-frame/d3-chart-frame.component';
import { ChangeCheckGuard } from './services/change-check.guard';


@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    ClipboardModule
  ],
  declarations: [
    ResearchLayoutComponent,
    ClientBinaryListComponent,
    PlatformConfigPanelComponent,
    ConfigVariableRowComponent,
    C3ChartComponent,
    ChartFrameComponent,
    D3ChartFrameComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [
    ClipboardModule,
    ResearchLayoutComponent,
    ClientBinaryListComponent,
    PlatformConfigPanelComponent,
    ConfigVariableRowComponent,
    C3ChartComponent,
    ChartFrameComponent,
    D3ChartFrameComponent,
  ],
  providers:[
    ResearcherAuthService, ChangeCheckGuard]
})
export class ResearchSharedModule { }