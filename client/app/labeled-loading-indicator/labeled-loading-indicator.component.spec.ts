import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LabeledLoadingIndicatorComponent } from './labeled-loading-indicator.component';

describe('LabeledLoadingIndicatorComponent', () => {
  let component: LabeledLoadingIndicatorComponent;
  let fixture: ComponentFixture<LabeledLoadingIndicatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LabeledLoadingIndicatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LabeledLoadingIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
