import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerStatusOverviewComponent } from './server-status-overview.component';

describe('ServerStatusOverviewComponent', () => {
  let component: ServerStatusOverviewComponent;
  let fixture: ComponentFixture<ServerStatusOverviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServerStatusOverviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServerStatusOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
