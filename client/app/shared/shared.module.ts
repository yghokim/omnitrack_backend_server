import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ToastComponent } from './toast/toast.component';
import { LoadingComponent } from './loading/loading.component';
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
  ],
  exports: [
    // Shared Modules
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MaterialDesignModule,
    // Shared Components
    ToastComponent,
    LoadingComponent,
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
    ToastComponent
  ]
})
export class SharedModule { }
