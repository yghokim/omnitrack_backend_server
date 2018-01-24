import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCellValueComponent } from './table-cell-value.component';

describe('TableCellValueComponent', () => {
  let component: TableCellValueComponent;
  let fixture: ComponentFixture<TableCellValueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TableCellValueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TableCellValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
