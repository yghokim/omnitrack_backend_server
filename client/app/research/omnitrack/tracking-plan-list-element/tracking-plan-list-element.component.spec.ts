import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingPlanListElementComponent } from './tracking-plan-list-element.component';

describe('TrackingPlanListElementComponent', () => {
  let component: TrackingPlanListElementComponent;
  let fixture: ComponentFixture<TrackingPlanListElementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackingPlanListElementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackingPlanListElementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
