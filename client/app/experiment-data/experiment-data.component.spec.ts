import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentDataComponent } from './experiment-data.component';

describe('ExperimentDataComponent', () => {
  let component: ExperimentDataComponent;
  let fixture: ComponentFixture<ExperimentDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
