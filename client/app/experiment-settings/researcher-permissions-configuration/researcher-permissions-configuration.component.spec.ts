import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResearcherPermissionsConfigurationComponent } from './researcher-permissions-configuration.component';

describe('ResearcherPermissionsConfigurationComponent', () => {
  let component: ResearcherPermissionsConfigurationComponent;
  let fixture: ComponentFixture<ResearcherPermissionsConfigurationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResearcherPermissionsConfigurationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResearcherPermissionsConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
