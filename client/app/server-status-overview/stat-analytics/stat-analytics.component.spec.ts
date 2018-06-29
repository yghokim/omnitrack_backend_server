import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StatAnalyticsComponent } from './stat-analytics.component';

describe('StatAnalyticsComponent', () => {
  let component: StatAnalyticsComponent;
  let fixture: ComponentFixture<StatAnalyticsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StatAnalyticsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
