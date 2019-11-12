import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewTrackerComponentComponent } from './preview-tracker-component.component';

describe('PreviewTrackerComponentComponent', () => {
  let component: PreviewTrackerComponentComponent;
  let fixture: ComponentFixture<PreviewTrackerComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PreviewTrackerComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewTrackerComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
