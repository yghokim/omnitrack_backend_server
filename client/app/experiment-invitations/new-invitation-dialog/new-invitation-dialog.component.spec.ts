import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewInvitationDialogComponent } from './new-invitation-dialog.component';

describe('NewInvitationDialogComponent', () => {
  let component: NewInvitationDialogComponent;
  let fixture: ComponentFixture<NewInvitationDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewInvitationDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewInvitationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
