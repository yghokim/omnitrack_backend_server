import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextPropertyViewComponent } from './text-property-view.component';

describe('TextPropertyViewComponent', () => {
  let component: TextPropertyViewComponent;
  let fixture: ComponentFixture<TextPropertyViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextPropertyViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextPropertyViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
