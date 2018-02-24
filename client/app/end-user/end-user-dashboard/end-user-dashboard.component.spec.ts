import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EndUserDashboardComponent } from './end-user-dashboard.component';

describe('EndUserDashboardComponent', () => {
  let component: EndUserDashboardComponent;
  let fixture: ComponentFixture<EndUserDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EndUserDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EndUserDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
