import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentClientSettingsComponent } from './experiment-client-settings.component';

describe('ExperimentClientSettingsComponent', () => {
  let component: ExperimentClientSettingsComponent;
  let fixture: ComponentFixture<ExperimentClientSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentClientSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentClientSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
