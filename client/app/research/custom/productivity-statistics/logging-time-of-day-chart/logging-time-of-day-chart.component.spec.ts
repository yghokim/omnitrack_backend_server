import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoggingTimeOfDayChartComponent } from './logging-time-of-day-chart.component';

describe('LoggingTimeOfDayChartComponent', () => {
  let component: LoggingTimeOfDayChartComponent;
  let fixture: ComponentFixture<LoggingTimeOfDayChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoggingTimeOfDayChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoggingTimeOfDayChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
