import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationCellComponent } from './location-cell.component';

describe('LocationCellComponent', () => {
  let component: LocationCellComponent;
  let fixture: ComponentFixture<LocationCellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LocationCellComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LocationCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
