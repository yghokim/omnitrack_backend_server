import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EndUserTrackerListComponent } from './end-user-tracker-list.component';

describe('EndUserTrackerListComponent', () => {
  let component: EndUserTrackerListComponent;
  let fixture: ComponentFixture<EndUserTrackerListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EndUserTrackerListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EndUserTrackerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
