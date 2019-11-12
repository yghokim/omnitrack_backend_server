import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewTriggerComponent } from './preview-trigger.component';

describe('PreviewTriggerComponent', () => {
  let component: PreviewTriggerComponent;
  let fixture: ComponentFixture<PreviewTriggerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PreviewTriggerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewTriggerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
