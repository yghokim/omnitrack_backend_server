import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentTrackingEngagementComponent } from './experiment-tracking-engagement.component';

describe('ExperimentTrackingEngagementComponent', () => {
  let component: ExperimentTrackingEngagementComponent;
  let fixture: ComponentFixture<ExperimentTrackingEngagementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentTrackingEngagementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentTrackingEngagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
