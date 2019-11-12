import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingPlanDetailComponent } from './tracking-plan-detail.component';

describe('TrackingPlanDetailComponent', () => {
  let component: TrackingPlanDetailComponent;
  let fixture: ComponentFixture<TrackingPlanDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackingPlanDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackingPlanDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
