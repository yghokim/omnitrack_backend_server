import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioFieldMobileInputComponent } from './audio-field-mobile-input.component';

describe('AudioFieldMobileInputComponent', () => {
  let component: AudioFieldMobileInputComponent;
  let fixture: ComponentFixture<AudioFieldMobileInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AudioFieldMobileInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AudioFieldMobileInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
