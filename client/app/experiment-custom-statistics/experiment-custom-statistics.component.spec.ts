import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentCustomStatisticsComponent } from './experiment-custom-statistics.component';

describe('ExperimentCustomStatisticsComponent', () => {
  let component: ExperimentCustomStatisticsComponent;
  let fixture: ComponentFixture<ExperimentCustomStatisticsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentCustomStatisticsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentCustomStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
