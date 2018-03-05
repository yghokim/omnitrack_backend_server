import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductivityTaskHeatmapComponent } from './productivity-task-heatmap.component';

describe('ProductivityTaskHeatmapComponent', () => {
  let component: ProductivityTaskHeatmapComponent;
  let fixture: ComponentFixture<ProductivityTaskHeatmapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductivityTaskHeatmapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductivityTaskHeatmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
