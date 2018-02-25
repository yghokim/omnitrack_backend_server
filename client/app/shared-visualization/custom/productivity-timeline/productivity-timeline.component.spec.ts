import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductivityTimelineComponent } from './productivity-timeline.component';

describe('ProductivityTimelineComponent', () => {
  let component: ProductivityTimelineComponent;
  let fixture: ComponentFixture<ProductivityTimelineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductivityTimelineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductivityTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
