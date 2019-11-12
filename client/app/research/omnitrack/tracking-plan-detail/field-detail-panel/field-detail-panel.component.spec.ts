import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldDetailPanelComponent } from './field-detail-panel.component';

describe('FieldDetailPanelComponent', () => {
  let component: FieldDetailPanelComponent;
  let fixture: ComponentFixture<FieldDetailPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FieldDetailPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldDetailPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
