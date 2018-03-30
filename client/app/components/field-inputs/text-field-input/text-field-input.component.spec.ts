import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextFieldInputComponent } from './text-field-input.component';

describe('TextFieldInputComponent', () => {
  let component: TextFieldInputComponent;
  let fixture: ComponentFixture<TextFieldInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextFieldInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextFieldInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
