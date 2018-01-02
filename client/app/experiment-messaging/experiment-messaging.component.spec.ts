import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentMessagingComponent } from './experiment-messaging.component';

describe('ExperimentMessagingComponent', () => {
  let component: ExperimentMessagingComponent;
  let fixture: ComponentFixture<ExperimentMessagingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentMessagingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentMessagingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
