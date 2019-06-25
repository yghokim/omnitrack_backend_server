import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NumberPropertyViewComponent } from './number-property-view.component';

describe('NumberPropertyViewComponent', () => {
  let component: NumberPropertyViewComponent;
  let fixture: ComponentFixture<NumberPropertyViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NumberPropertyViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NumberPropertyViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
