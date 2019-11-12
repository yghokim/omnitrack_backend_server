import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectableMenuItemComponent } from './selectable-menu-item.component';

describe('SelectableMenuItemComponent', () => {
  let component: SelectableMenuItemComponent;
  let fixture: ComponentFixture<SelectableMenuItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectableMenuItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectableMenuItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
