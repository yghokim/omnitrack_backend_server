import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductivityStatisticsComponent } from './productivity-statistics.component';

describe('ProductivityStatisticsComponent', () => {
  let component: ProductivityStatisticsComponent;
  let fixture: ComponentFixture<ProductivityStatisticsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductivityStatisticsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductivityStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
