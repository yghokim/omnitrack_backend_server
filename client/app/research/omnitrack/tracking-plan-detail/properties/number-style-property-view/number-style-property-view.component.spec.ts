import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NumberStylePropertyViewComponent } from './number-style-property-view.component';

describe('NumberStylePropertyViewComponent', () => {
  let component: NumberStylePropertyViewComponent;
  let fixture: ComponentFixture<NumberStylePropertyViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NumberStylePropertyViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NumberStylePropertyViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
