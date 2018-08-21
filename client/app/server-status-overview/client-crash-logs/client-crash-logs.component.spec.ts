import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientCrashLogsComponent } from './client-crash-logs.component';

describe('ClientCrashLogsComponent', () => {
  let component: ClientCrashLogsComponent;
  let fixture: ComponentFixture<ClientCrashLogsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClientCrashLogsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientCrashLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
