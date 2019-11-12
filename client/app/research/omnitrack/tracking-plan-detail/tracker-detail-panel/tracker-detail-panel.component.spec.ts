import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackerDetailPanelComponent } from './tracker-detail-panel.component';

describe('TrackerDetailPanelComponent', () => {
  let component: TrackerDetailPanelComponent;
  let fixture: ComponentFixture<TrackerDetailPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackerDetailPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackerDetailPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
