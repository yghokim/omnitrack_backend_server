import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductivityDurationStackedBarChartComponent } from './productivity-duration-stacked-bar-chart.component';

describe('ProductivityDurationStackedBarChartComponent', () => {
  let component: ProductivityDurationStackedBarChartComponent;
  let fixture: ComponentFixture<ProductivityDurationStackedBarChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductivityDurationStackedBarChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductivityDurationStackedBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
