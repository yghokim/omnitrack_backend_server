import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TriggerTreeViewComponent } from './trigger-tree-view.component';

describe('TriggerTreeViewComponent', () => {
  let component: TriggerTreeViewComponent;
  let fixture: ComponentFixture<TriggerTreeViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TriggerTreeViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TriggerTreeViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
