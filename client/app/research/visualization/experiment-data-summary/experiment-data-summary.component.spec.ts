import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentDataSummaryComponent } from './experiment-data-summary.component';

describe('ExperimentDataSummaryComponent', () => {
  let component: ExperimentDataSummaryComponent;
  let fixture: ComponentFixture<ExperimentDataSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentDataSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentDataSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
