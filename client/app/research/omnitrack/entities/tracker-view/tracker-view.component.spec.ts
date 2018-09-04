import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackerViewComponent } from './tracker-view.component';

describe('TrackerViewComponent', () => {
  let component: TrackerViewComponent;
  let fixture: ComponentFixture<TrackerViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackerViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackerViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
