import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RatingOptionsPropertyViewComponent } from './rating-options-property-view.component';

describe('RatingOptionsPropertyViewComponent', () => {
  let component: RatingOptionsPropertyViewComponent;
  let fixture: ComponentFixture<RatingOptionsPropertyViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RatingOptionsPropertyViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RatingOptionsPropertyViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
