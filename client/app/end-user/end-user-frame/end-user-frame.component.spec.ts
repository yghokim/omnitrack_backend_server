import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EndUserFrameComponent } from './end-user-frame.component';

describe('EndUserFrameComponent', () => {
  let component: EndUserFrameComponent;
  let fixture: ComponentFixture<EndUserFrameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EndUserFrameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EndUserFrameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
