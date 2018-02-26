import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageCellComponent } from './image-cell.component';

describe('ImageCellComponent', () => {
  let component: ImageCellComponent;
  let fixture: ComponentFixture<ImageCellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImageCellComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
