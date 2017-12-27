import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResearchDashboardComponent } from './research-dashboard.component';

describe('ResearchDashboardComponent', () => {
  let component: ResearchDashboardComponent;
  let fixture: ComponentFixture<ResearchDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResearchDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResearchDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
