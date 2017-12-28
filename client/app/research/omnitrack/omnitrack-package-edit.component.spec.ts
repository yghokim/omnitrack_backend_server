import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OmniTrackPackageEditComponent } from './omnitrack-package-edit.component';

describe('OmniTrackPackageEditComponent', () => {
  let component: OmniTrackPackageEditComponent;
  let fixture: ComponentFixture<OmniTrackPackageEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OmniTrackPackageEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OmniTrackPackageEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
