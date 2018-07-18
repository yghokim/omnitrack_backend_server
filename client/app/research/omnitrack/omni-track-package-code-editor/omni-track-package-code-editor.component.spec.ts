import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OmniTrackPackageCodeEditorComponent } from './omni-track-package-code-editor.component';

describe('OmniTrackPackageCodeEditorComponent', () => {
  let component: OmniTrackPackageCodeEditorComponent;
  let fixture: ComponentFixture<OmniTrackPackageCodeEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OmniTrackPackageCodeEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OmniTrackPackageCodeEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
