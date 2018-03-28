import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemFieldInputComponent } from './item-field-input.component';

describe('ItemFieldInputComponent', () => {
  let component: ItemFieldInputComponent;
  let fixture: ComponentFixture<ItemFieldInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemFieldInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemFieldInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
