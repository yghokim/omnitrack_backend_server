import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BooleanPropertyViewComponent } from './boolean-property-view.component';

describe('BooleanPropertyViewComponent', () => {
  let component: BooleanPropertyViewComponent;
  let fixture: ComponentFixture<BooleanPropertyViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BooleanPropertyViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BooleanPropertyViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
