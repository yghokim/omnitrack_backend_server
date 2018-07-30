import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatformConfigPanelComponent } from './platform-config-panel.component';

describe('PlatformConfigPanelComponent', () => {
  let component: PlatformConfigPanelComponent;
  let fixture: ComponentFixture<PlatformConfigPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlatformConfigPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlatformConfigPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
