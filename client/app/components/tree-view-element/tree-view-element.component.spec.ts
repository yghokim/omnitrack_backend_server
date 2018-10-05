import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeViewElementComponent } from './tree-view-element.component';

describe('TreeViewElementComponent', () => {
  let component: TreeViewElementComponent;
  let fixture: ComponentFixture<TreeViewElementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TreeViewElementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeViewElementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
