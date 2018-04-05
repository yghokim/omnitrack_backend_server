import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChoiceFieldInputComponent } from './choice-field-input.component';

describe('ChoiceFieldInputComponent', () => {
  let component: ChoiceFieldInputComponent;
  let fixture: ComponentFixture<ChoiceFieldInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChoiceFieldInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChoiceFieldInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
