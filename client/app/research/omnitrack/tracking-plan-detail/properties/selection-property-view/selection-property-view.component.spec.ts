import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectionPropertyViewComponent } from './selection-property-view.component';

describe('SelectionPropertyViewComponent', () => {
  let component: SelectionPropertyViewComponent;
  let fixture: ComponentFixture<SelectionPropertyViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectionPropertyViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectionPropertyViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
