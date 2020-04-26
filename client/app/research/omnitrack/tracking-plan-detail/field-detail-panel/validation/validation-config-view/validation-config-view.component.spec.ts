import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidationConfigViewComponent } from './validation-config-view.component';

describe('ValidationConfigViewComponent', () => {
  let component: ValidationConfigViewComponent;
  let fixture: ComponentFixture<ValidationConfigViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ValidationConfigViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidationConfigViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
