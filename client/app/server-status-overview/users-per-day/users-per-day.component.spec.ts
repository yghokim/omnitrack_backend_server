import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersPerDayComponent } from './users-per-day.component';

describe('UsersPerDayComponent', () => {
  let component: UsersPerDayComponent;
  let fixture: ComponentFixture<UsersPerDayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UsersPerDayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersPerDayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
