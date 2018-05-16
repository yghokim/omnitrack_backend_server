import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientUsageComponent } from './client-usage.component';

describe('ClientUsageComponent', () => {
  let component: ClientUsageComponent;
  let fixture: ComponentFixture<ClientUsageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClientUsageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
