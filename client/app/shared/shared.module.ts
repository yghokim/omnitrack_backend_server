import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { ChartModule } from 'angular-highcharts';

import { ToastComponent } from './toast/toast.component';
import { LoadingComponent } from './loading/loading.component';
import { TableCellValueComponent } from '../components/table-cell-value/table-cell-value.component';
import { FileDropModule } from 'ngx-file-drop';
import {PrettySizeModule} from 'angular-pretty-size';
import { ProductivityTimelineComponent } from '../shared-visualization/custom/productivity-timeline/productivity-timeline.component';
import { D3ChartFrameComponent } from '../shared-visualization/d3-chart-frame/d3-chart-frame.component';
import { ChartFrameComponent } from '../shared-visualization/chart-frame/chart-frame.component';
import { MaterialDesignModule } from '../material-design.module';
import { ProductivityDashboardComponent } from '../shared-visualization/custom/productivity-dashboard/productivity-dashboard.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    FileDropModule,
    MaterialDesignModule,
    PrettySizeModule,
    ChartModule
  ],
  exports: [
    // Shared Modules
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    FileDropModule,
    MaterialDesignModule,
    PrettySizeModule,
    ChartModule,
    // Shared Components
    ToastComponent,
    LoadingComponent,
    TableCellValueComponent,
    ChartFrameComponent,
    D3ChartFrameComponent,
    ProductivityDashboardComponent,
    ProductivityTimelineComponent
  ],
  declarations: [
    ToastComponent,
    LoadingComponent,
    TableCellValueComponent,
    ChartFrameComponent,
    D3ChartFrameComponent,
    ProductivityTimelineComponent,
    ProductivityDashboardComponent
  ],
  providers: [
    ToastComponent
  ]
})
export class SharedModule { }
