import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DevicesPerDayComponent } from './devices-per-day.component';

describe('DevicesPerDayComponent', () => {
  let component: DevicesPerDayComponent;
  let fixture: ComponentFixture<DevicesPerDayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DevicesPerDayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DevicesPerDayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
