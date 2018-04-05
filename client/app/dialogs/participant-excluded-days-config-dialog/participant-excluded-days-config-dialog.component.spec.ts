import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantExcludedDaysConfigDialogComponent } from './participant-excluded-days-config-dialog.component';

describe('ParticipantExcludedDaysConfigDialogComponent', () => {
  let component: ParticipantExcludedDaysConfigDialogComponent;
  let fixture: ComponentFixture<ParticipantExcludedDaysConfigDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticipantExcludedDaysConfigDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantExcludedDaysConfigDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
