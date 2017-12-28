import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OmniTrackPackageListComponent } from './omnitrack-package-list.component';

describe('OmniTrackPackageListComponent', () => {
  let component: OmniTrackPackageListComponent;
  let fixture: ComponentFixture<OmniTrackPackageListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OmniTrackPackageListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OmniTrackPackageListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
