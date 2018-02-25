import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductivityDashboardComponent } from './productivity-dashboard.component';

describe('ProductivityDashboardComponent', () => {
  let component: ProductivityDashboardComponent;
  let fixture: ComponentFixture<ProductivityDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductivityDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductivityDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
