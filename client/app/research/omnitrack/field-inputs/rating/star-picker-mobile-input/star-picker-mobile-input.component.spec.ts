import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StarPickerMobileInputComponent } from './star-picker-mobile-input.component';

describe('StarPickerMobileInputComponent', () => {
  let component: StarPickerMobileInputComponent;
  let fixture: ComponentFixture<StarPickerMobileInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StarPickerMobileInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StarPickerMobileInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
