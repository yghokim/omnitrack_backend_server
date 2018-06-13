import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InstallationWizardComponent } from './installation-wizard.component';

describe('InstallationWizardComponent', () => {
  let component: InstallationWizardComponent;
  let fixture: ComponentFixture<InstallationWizardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InstallationWizardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InstallationWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
