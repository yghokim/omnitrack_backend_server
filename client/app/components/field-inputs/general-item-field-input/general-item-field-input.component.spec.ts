import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralItemFieldInputComponent } from './general-item-field-input.component';

describe('GeneralItemFieldInputComponent', () => {
  let component: GeneralItemFieldInputComponent;
  let fixture: ComponentFixture<GeneralItemFieldInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeneralItemFieldInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneralItemFieldInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
