import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyAverageComponent } from './daily-average.component';

describe('DailyAverageComponent', () => {
  let component: DailyAverageComponent;
  let fixture: ComponentFixture<DailyAverageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DailyAverageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DailyAverageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
