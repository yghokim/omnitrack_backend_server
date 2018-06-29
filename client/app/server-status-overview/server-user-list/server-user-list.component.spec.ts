import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerUserListComponent } from './server-user-list.component';

describe('ServerUserListComponent', () => {
  let component: ServerUserListComponent;
  let fixture: ComponentFixture<ServerUserListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServerUserListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerUserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
