import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadClientBinaryDialogComponent } from './upload-client-binary-dialog.component';

describe('UploadClientBinaryDialogComponent', () => {
  let component: UploadClientBinaryDialogComponent;
  let fixture: ComponentFixture<UploadClientBinaryDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadClientBinaryDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadClientBinaryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
