import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EndUserTriggerListComponent } from './end-user-trigger-list.component';

describe('EndUserTriggerListComponent', () => {
  let component: EndUserTriggerListComponent;
  let fixture: ComponentFixture<EndUserTriggerListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EndUserTriggerListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EndUserTriggerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
