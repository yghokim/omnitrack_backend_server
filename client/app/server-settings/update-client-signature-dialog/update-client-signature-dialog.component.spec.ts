import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateClientSignatureDialogComponent } from './update-client-signature-dialog.component';

describe('UpdateClientSignatureDialogComponent', () => {
  let component: UpdateClientSignatureDialogComponent;
  let fixture: ComponentFixture<UpdateClientSignatureDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpdateClientSignatureDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateClientSignatureDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
