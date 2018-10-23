import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ChartModule, HIGHCHARTS_MODULES } from 'angular-highcharts';
import * as more from 'highcharts/highcharts-more.src';
import * as exporting from 'highcharts/modules/exporting.src';
import * as heatmap from 'highcharts/modules/heatmap.src';
import * as xrange from 'highcharts/modules/xrange.src';
import { ToastComponent } from './toast/toast.component';
import { LoadingComponent } from './loading/loading.component';
import { D3ChartFrameComponent } from '../shared-visualization/d3-chart-frame/d3-chart-frame.component';
import { ChartFrameComponent } from '../shared-visualization/chart-frame/chart-frame.component';
import { MaterialDesignModule } from '../material-design.module';
import { FileSizePipe } from '../pipes/file-size.pipe';
import { LabeledLoadingIndicatorComponent } from '../labeled-loading-indicator/labeled-loading-indicator.component';
import { BusyOverlayComponent } from '../busy-overlay/busy-overlay.component';
import { CommonModule } from '@angular/common';
import { AnonymizeEmailPipe } from '../pipes/anonymize-email.pipe';

/*
import { ProductivityTimelineComponent } from '../shared-visualization/custom/productivity-timeline/productivity-timeline.component';
import { ProductivityDashboardComponent } from '../shared-visualization/custom/productivity-dashboard/productivity-dashboard.component';
import { ProductivityEntryPerDayComponent } from '../shared-visualization/custom/productivity-entry-per-day/productivity-entry-per-day.component';
import { ProductivityDurationStackedBarChartComponent } from '../shared-visualization/custom/productivity-duration-stacked-bar-chart/productivity-duration-stacked-bar-chart.component';
import { ProductivityDurationPerVariableComponent } from '../shared-visualization/custom/productivity-duration-per-variable/productivity-duration-per-variable.component';
import { ProductivityTaskHeatmapComponent } from '../shared-visualization/custom/productivity-task-heatmap/productivity-task-heatmap.component';
import { ProductivityTimelineDayDirective } from '../shared-visualization/custom/productivity-timeline/productivity-timeline-day.directive';*/

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MaterialDesignModule,
    ChartModule,
  ],
  exports: [
    // Shared Modules
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MaterialDesignModule,
    ChartModule,
    // Shared Components
    ToastComponent,
    LoadingComponent,
    ChartFrameComponent,
    D3ChartFrameComponent,
    /*
    ProductivityDashboardComponent,
    ProductivityTimelineComponent,
    ProductivityDurationPerVariableComponent,*/
    FileSizePipe,
    LabeledLoadingIndicatorComponent,
    BusyOverlayComponent,
    AnonymizeEmailPipe,
  ],
  declarations: [
    ToastComponent,
    BusyOverlayComponent,
    LoadingComponent,
    ChartFrameComponent,
    D3ChartFrameComponent,
    /*
    ProductivityTimelineComponent,
    ProductivityDashboardComponent,
    ProductivityEntryPerDayComponent,
    ProductivityDurationStackedBarChartComponent,
    ProductivityDurationPerVariableComponent,
    ProductivityTaskHeatmapComponent,
    ProductivityTimelineDayDirective,*/
    FileSizePipe,
    LabeledLoadingIndicatorComponent,
    AnonymizeEmailPipe,
  ],
  entryComponents: [
  ],
  providers: [
    ToastComponent,
    {provide: HIGHCHARTS_MODULES, useFactory:()=>[heatmap, xrange, more, exporting]}
  ]
})
export class SharedModule { }
