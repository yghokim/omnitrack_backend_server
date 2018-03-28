import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateItemCellValueDialogComponent } from './update-item-cell-value-dialog.component';

describe('UpdateItemCellValueDialogComponent', () => {
  let component: UpdateItemCellValueDialogComponent;
  let fixture: ComponentFixture<UpdateItemCellValueDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpdateItemCellValueDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateItemCellValueDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
