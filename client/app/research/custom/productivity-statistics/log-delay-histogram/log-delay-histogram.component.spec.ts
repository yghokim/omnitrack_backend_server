import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LogDelayHistogramComponent } from './log-delay-histogram.component';

describe('LogDelayHistogramComponent', () => {
  let component: LogDelayHistogramComponent;
  let fixture: ComponentFixture<LogDelayHistogramComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LogDelayHistogramComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogDelayHistogramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
