import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LockFlagButtonComponent } from './lock-flag-button.component';

describe('LockFlagButtonComponent', () => {
  let component: LockFlagButtonComponent;
  let fixture: ComponentFixture<LockFlagButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LockFlagButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LockFlagButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
