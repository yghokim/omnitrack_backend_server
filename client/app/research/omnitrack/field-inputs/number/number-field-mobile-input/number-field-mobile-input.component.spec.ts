import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NumberFieldMobileInputComponent } from './number-field-mobile-input.component';

describe('NumberFieldMobileInputComponent', () => {
  let component: NumberFieldMobileInputComponent;
  let fixture: ComponentFixture<NumberFieldMobileInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NumberFieldMobileInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NumberFieldMobileInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
