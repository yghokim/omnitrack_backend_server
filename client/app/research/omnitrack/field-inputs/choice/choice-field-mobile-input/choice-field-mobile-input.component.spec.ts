import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChoiceFieldMobileInputComponent } from './choice-field-mobile-input.component';

describe('ChoiceFieldMobileInputComponent', () => {
  let component: ChoiceFieldMobileInputComponent;
  let fixture: ComponentFixture<ChoiceFieldMobileInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChoiceFieldMobileInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChoiceFieldMobileInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
