import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingDataSynchronizerWidgetComponent } from './tracking-data-synchronizer-widget.component';

describe('TrackingDataSynchronizerWidgetComponent', () => {
  let component: TrackingDataSynchronizerWidgetComponent;
  let fixture: ComponentFixture<TrackingDataSynchronizerWidgetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TrackingDataSynchronizerWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackingDataSynchronizerWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
