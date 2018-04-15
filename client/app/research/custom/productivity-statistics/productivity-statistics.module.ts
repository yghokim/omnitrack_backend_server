import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductivityStatisticsComponent } from './productivity-statistics.component';
import { LogDelayHistogramComponent } from './log-delay-histogram/log-delay-histogram.component';
import { DurationCoverageComponent } from './duration-coverage/duration-coverage.component';
import { LoggingTimeOfDayChartComponent } from './logging-time-of-day-chart/logging-time-of-day-chart.component';
import { SessionsComponent } from './sessions/sessions.component';
import { TimestampAnalysisComponent } from './timestamp-analysis/timestamp-analysis.component';
import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    SharedModule
  ],
  declarations: [
    ProductivityStatisticsComponent,
    LogDelayHistogramComponent,
    DurationCoverageComponent,
    LoggingTimeOfDayChartComponent,
    SessionsComponent,
    TimestampAnalysisComponent
  ],
  exports:[
    ProductivityStatisticsComponent,
    LogDelayHistogramComponent,
    DurationCoverageComponent,
    LoggingTimeOfDayChartComponent,
    SessionsComponent,
    TimestampAnalysisComponent
  ]
})
export class ProductivityStatisticsModule { }
