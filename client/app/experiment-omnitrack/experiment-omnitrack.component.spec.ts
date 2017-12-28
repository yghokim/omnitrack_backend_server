import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentOmniTrackComponent } from './experiment-omnitrack.component';

describe('ExperimentOmniTrackComponent', () => {
  let component: ExperimentOmniTrackComponent;
  let fixture: ComponentFixture<ExperimentOmniTrackComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentOmniTrackComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentOmniTrackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
