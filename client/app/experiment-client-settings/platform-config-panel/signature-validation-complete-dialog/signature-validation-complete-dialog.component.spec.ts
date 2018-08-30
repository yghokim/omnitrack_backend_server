import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SignatureValidationCompleteDialogComponent } from './signature-validation-complete-dialog.component';

describe('SignatureValidationCompleteDialogComponent', () => {
  let component: SignatureValidationCompleteDialogComponent;
  let fixture: ComponentFixture<SignatureValidationCompleteDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SignatureValidationCompleteDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignatureValidationCompleteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
