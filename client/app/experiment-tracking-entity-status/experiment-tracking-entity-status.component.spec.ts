import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentTrackingEntityStatusComponent } from './experiment-tracking-entity-status.component';

describe('ExperimentTrackingEntityStatusComponent', () => {
  let component: ExperimentTrackingEntityStatusComponent;
  let fixture: ComponentFixture<ExperimentTrackingEntityStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentTrackingEntityStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentTrackingEntityStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
