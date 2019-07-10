import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LikertPickerMobileInputComponent } from './likert-picker-mobile-input.component';

describe('LikertPickerMobileInputComponent', () => {
  let component: LikertPickerMobileInputComponent;
  let fixture: ComponentFixture<LikertPickerMobileInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LikertPickerMobileInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LikertPickerMobileInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
