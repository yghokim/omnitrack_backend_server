import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RatingFieldMobileInputComponent } from './rating-field-mobile-input.component';

describe('RatingFieldMobileInputComponent', () => {
  let component: RatingFieldMobileInputComponent;
  let fixture: ComponentFixture<RatingFieldMobileInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RatingFieldMobileInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RatingFieldMobileInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
