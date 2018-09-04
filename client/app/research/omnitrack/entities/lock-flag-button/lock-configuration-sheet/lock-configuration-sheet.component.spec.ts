import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LockConfigurationSheetComponent } from './lock-configuration-sheet.component';

describe('LockConfigurationSheetComponent', () => {
  let component: LockConfigurationSheetComponent;
  let fixture: ComponentFixture<LockConfigurationSheetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LockConfigurationSheetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LockConfigurationSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
