import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentInvitationsComponent } from './experiment-invitations.component';

describe('ExperimentInvitationsComponent', () => {
  let component: ExperimentInvitationsComponent;
  let fixture: ComponentFixture<ExperimentInvitationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentInvitationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentInvitationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
