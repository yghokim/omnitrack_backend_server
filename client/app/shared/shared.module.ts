import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { ChartModule, HIGHCHARTS_MODULES } from 'angular-highcharts';
import * as more from 'highcharts/highcharts-more.src';
import * as exporting from 'highcharts/modules/exporting.src';
import * as heatmap from 'highcharts/modules/heatmap.src';


import { ToastComponent } from './toast/toast.component';
import { LoadingComponent } from './loading/loading.component';
import { TableCellValueComponent } from '../components/table-cell-value/table-cell-value.component';
import { FileDropModule } from 'ngx-file-drop';
import { ProductivityTimelineComponent } from '../shared-visualization/custom/productivity-timeline/productivity-timeline.component';
import { D3ChartFrameComponent } from '../shared-visualization/d3-chart-frame/d3-chart-frame.component';
import { ChartFrameComponent } from '../shared-visualization/chart-frame/chart-frame.component';
import { MaterialDesignModule } from '../material-design.module';
import { ProductivityDashboardComponent } from '../shared-visualization/custom/productivity-dashboard/productivity-dashboard.component';
import { ProductivityEntryPerDayComponent } from '../shared-visualization/custom/productivity-entry-per-day/productivity-entry-per-day.component';
import { ProductivityDurationStackedBarChartComponent } from '../shared-visualization/custom/productivity-duration-stacked-bar-chart/productivity-duration-stacked-bar-chart.component';
import { ProductivityDurationPerVariableComponent } from '../shared-visualization/custom/productivity-duration-per-variable/productivity-duration-per-variable.component';
import { ProductivityTaskHeatmapComponent } from '../shared-visualization/custom/productivity-task-heatmap/productivity-task-heatmap.component';
import { ProductivityTimelineDayDirective } from '../shared-visualization/custom/productivity-timeline/productivity-timeline-day.directive';
import { FileSizePipe } from '../pipes/file-size.pipe';
import { ItemFieldInputComponent } from '../components/item-field-input/item-field-input.component';
import { GeneralItemFieldInputComponent } from '../components/field-inputs/general-item-field-input/general-item-field-input.component';
import { TimePointFieldInputComponent } from '../components/field-inputs/time-point-field-input/time-point-field-input.component';
import { TextFieldInputComponent } from '../components/field-inputs/text-field-input/text-field-input.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    FileDropModule,
    MaterialDesignModule,
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
    ChartModule,
    // Shared Components
    ToastComponent,
    LoadingComponent,
    TableCellValueComponent,
    ChartFrameComponent,
    D3ChartFrameComponent,
    ProductivityDashboardComponent,
    ProductivityTimelineComponent,
    ProductivityDurationPerVariableComponent,
    FileSizePipe,
    ItemFieldInputComponent,
    GeneralItemFieldInputComponent,
    TimePointFieldInputComponent
  ],
  declarations: [
    ToastComponent,
    LoadingComponent,
    TableCellValueComponent,
    ChartFrameComponent,
    D3ChartFrameComponent,
    ProductivityTimelineComponent,
    ProductivityDashboardComponent,
    ProductivityEntryPerDayComponent,
    ProductivityDurationStackedBarChartComponent,
    ProductivityDurationPerVariableComponent,
    ProductivityTaskHeatmapComponent,
    ProductivityTimelineDayDirective,
    FileSizePipe,
    ItemFieldInputComponent,
    GeneralItemFieldInputComponent,
    TimePointFieldInputComponent,
    TextFieldInputComponent
  ],
  providers: [
    ToastComponent,
    {provide: HIGHCHARTS_MODULES, useFactory:()=>[heatmap, more, exporting]}
  ]
})
export class SharedModule { }
