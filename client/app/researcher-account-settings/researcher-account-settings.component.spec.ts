import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResearcherAccountSettingsComponent } from './researcher-account-settings.component';

describe('ResearcherAccountSettingsComponent', () => {
  let component: ResearcherAccountSettingsComponent;
  let fixture: ComponentFixture<ResearcherAccountSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResearcherAccountSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResearcherAccountSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
