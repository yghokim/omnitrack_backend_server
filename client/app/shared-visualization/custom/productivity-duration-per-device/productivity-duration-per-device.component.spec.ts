import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductivityDurationPerDeviceComponent } from './productivity-duration-per-device.component';

describe('ProductivityDurationPerDeviceComponent', () => {
  let component: ProductivityDurationPerDeviceComponent;
  let fixture: ComponentFixture<ProductivityDurationPerDeviceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductivityDurationPerDeviceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductivityDurationPerDeviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
