import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TriggerDetailPanelComponent } from './trigger-detail-panel.component';

describe('TriggerDetailPanelComponent', () => {
  let component: TriggerDetailPanelComponent;
  let fixture: ComponentFixture<TriggerDetailPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TriggerDetailPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TriggerDetailPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
