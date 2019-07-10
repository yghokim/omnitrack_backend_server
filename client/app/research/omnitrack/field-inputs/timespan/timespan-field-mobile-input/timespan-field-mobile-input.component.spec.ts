import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeSpanFieldMobileInputComponent } from './timespan-field-mobile-input.component';

describe('TimeSpanFieldMobileInputComponent', () => {
  let component: TimeSpanFieldMobileInputComponent;
  let fixture: ComponentFixture<TimeSpanFieldMobileInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimeSpanFieldMobileInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeSpanFieldMobileInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
