import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackerTreeViewComponent } from './tracker-tree-view.component';

describe('TrackerTreeViewComponent', () => {
  let component: TrackerTreeViewComponent;
  let fixture: ComponentFixture<TrackerTreeViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackerTreeViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackerTreeViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
