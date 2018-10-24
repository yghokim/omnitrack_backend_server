import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ProductivityDurationPerVariableComponent } from './productivity-duration-per-variable/productivity-duration-per-variable.component';
import { ProductivityDurationStackedBarChartComponent } from './productivity-duration-stacked-bar-chart/productivity-duration-stacked-bar-chart.component';
import { ProductivityEntryPerDayComponent } from './productivity-entry-per-day/productivity-entry-per-day.component';
import { ProductivityDashboardComponent } from './productivity-dashboard/productivity-dashboard.component';
import { ProductivityTaskHeatmapComponent } from './productivity-task-heatmap/productivity-task-heatmap.component';
import { ProductivityTimelineComponent } from './productivity-timeline/productivity-timeline.component';
import { ProductivityTimelineDayDirective } from './productivity-timeline/productivity-timeline-day.directive';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

@NgModule({  
  imports: [CommonModule, 
  SharedModule],
  declarations: [
    ProductivityDashboardComponent,
    ProductivityDurationPerVariableComponent,
    ProductivityDurationStackedBarChartComponent,
    ProductivityEntryPerDayComponent,
    ProductivityTaskHeatmapComponent,
    ProductivityTimelineComponent,
    ProductivityTimelineDayDirective
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProductivityModule { }