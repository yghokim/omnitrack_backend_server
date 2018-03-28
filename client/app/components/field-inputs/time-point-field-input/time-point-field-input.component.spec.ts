import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimePointFieldInputComponent } from './time-point-field-input.component';

describe('TimePointFieldInputComponent', () => {
  let component: TimePointFieldInputComponent;
  let fixture: ComponentFixture<TimePointFieldInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimePointFieldInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimePointFieldInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
