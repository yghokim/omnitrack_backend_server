import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseInvitationDialogComponent } from './choose-invitation-dialog.component';

describe('ChooseInvitationDialogComponent', () => {
  let component: ChooseInvitationDialogComponent;
  let fixture: ComponentFixture<ChooseInvitationDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChooseInvitationDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChooseInvitationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
