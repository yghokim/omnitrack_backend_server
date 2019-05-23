import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserClientFrameComponent } from './user-client-frame.component';

describe('UserClientFrameComponent', () => {
  let component: UserClientFrameComponent;
  let fixture: ComponentFixture<UserClientFrameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserClientFrameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserClientFrameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
