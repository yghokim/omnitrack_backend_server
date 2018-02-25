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

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    FileDropModule,
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
    PrettySizeModule,
    ChartModule,
    // Shared Components
    ToastComponent,
    LoadingComponent,
    TableCellValueComponent,
    ProductivityTimelineComponent
  ],
  declarations: [
    ToastComponent,
    LoadingComponent,
    TableCellValueComponent,
    ProductivityTimelineComponent
  ],
  providers: [
    ToastComponent
  ]
})
export class SharedModule { }
