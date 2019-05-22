import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateUserAccountDialogComponent } from './create-user-account-dialog.component';

describe('CreateUserAccountDialogComponent', () => {
  let component: CreateUserAccountDialogComponent;
  let fixture: ComponentFixture<CreateUserAccountDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateUserAccountDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateUserAccountDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
