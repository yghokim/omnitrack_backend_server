import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DemographicEditorComponent } from './demographic-editor.component';

describe('DemographicEditorComponent', () => {
  let component: DemographicEditorComponent;
  let fixture: ComponentFixture<DemographicEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DemographicEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DemographicEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
