import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentConsentEditorComponent } from './experiment-consent-editor.component';

describe('ExperimentConsentEditorComponent', () => {
  let component: ExperimentConsentEditorComponent;
  let fixture: ComponentFixture<ExperimentConsentEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentConsentEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentConsentEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
