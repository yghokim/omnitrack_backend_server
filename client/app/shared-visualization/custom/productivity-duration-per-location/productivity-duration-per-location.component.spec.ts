import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductivityDurationPerLocationComponent } from './productivity-duration-per-location.component';

describe('ProductivityDurationPerLocationComponent', () => {
  let component: ProductivityDurationPerLocationComponent;
  let fixture: ComponentFixture<ProductivityDurationPerLocationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductivityDurationPerLocationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductivityDurationPerLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
