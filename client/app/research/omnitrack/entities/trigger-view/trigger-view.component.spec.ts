import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TriggerViewComponent } from './trigger-view.component';

describe('TriggerViewComponent', () => {
  let component: TriggerViewComponent;
  let fixture: ComponentFixture<TriggerViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TriggerViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TriggerViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
