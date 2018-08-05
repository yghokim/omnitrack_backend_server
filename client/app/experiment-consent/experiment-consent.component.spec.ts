import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentConsentComponent } from './experiment-consent.component';

describe('ExperimentConsentComponent', () => {
  let component: ExperimentConsentComponent;
  let fixture: ComponentFixture<ExperimentConsentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentConsentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentConsentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
