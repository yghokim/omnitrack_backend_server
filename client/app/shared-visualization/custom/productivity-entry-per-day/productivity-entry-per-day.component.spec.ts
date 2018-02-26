import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductivityEntryPerDayComponent } from './productivity-entry-per-day.component';

describe('ProductivityEntryPerDayComponent', () => {
  let component: ProductivityEntryPerDayComponent;
  let fixture: ComponentFixture<ProductivityEntryPerDayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductivityEntryPerDayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductivityEntryPerDayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
