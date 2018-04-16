import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductivityAnalysisComponent } from './productivity-analysis.component';

describe('ProductivityAnalysisComponent', () => {
  let component: ProductivityAnalysisComponent;
  let fixture: ComponentFixture<ProductivityAnalysisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductivityAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductivityAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
