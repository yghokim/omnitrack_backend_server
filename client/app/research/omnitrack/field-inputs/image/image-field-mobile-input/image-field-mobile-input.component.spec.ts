import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageFieldMobileInputComponent } from './image-field-mobile-input.component';

describe('ImageFieldMobileInputComponent', () => {
  let component: ImageFieldMobileInputComponent;
  let fixture: ComponentFixture<ImageFieldMobileInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImageFieldMobileInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageFieldMobileInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
