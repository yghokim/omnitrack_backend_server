import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewTrackingPackageDialogComponent } from './new-tracking-package-dialog.component';

describe('NewTrackingPackageDialogComponent', () => {
  let component: NewTrackingPackageDialogComponent;
  let fixture: ComponentFixture<NewTrackingPackageDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewTrackingPackageDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewTrackingPackageDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
