import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeFieldMobileInputComponent } from './time-field-mobile-input.component';

describe('TimeFieldMobileInputComponent', () => {
  let component: TimeFieldMobileInputComponent;
  let fixture: ComponentFixture<TimeFieldMobileInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimeFieldMobileInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeFieldMobileInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
