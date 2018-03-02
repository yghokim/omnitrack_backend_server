import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PerParticipantVisualizationDashboardComponent } from './per-participant-visualization-dashboard.component';

describe('PerParticipantVisualizationDashboardComponent', () => {
  let component: PerParticipantVisualizationDashboardComponent;
  let fixture: ComponentFixture<PerParticipantVisualizationDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PerParticipantVisualizationDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PerParticipantVisualizationDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
