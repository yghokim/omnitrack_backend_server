import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewValidationRuleDialogComponent } from './new-validation-rule-dialog.component';

describe('NewValidationRuleDialogComponent', () => {
  let component: NewValidationRuleDialogComponent;
  let fixture: ComponentFixture<NewValidationRuleDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewValidationRuleDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewValidationRuleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
