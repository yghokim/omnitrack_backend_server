import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextFieldMobileInputComponent } from './text-field-mobile-input.component';

describe('TextFieldMobileInputComponent', () => {
  let component: TextFieldMobileInputComponent;
  let fixture: ComponentFixture<TextFieldMobileInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextFieldMobileInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextFieldMobileInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
