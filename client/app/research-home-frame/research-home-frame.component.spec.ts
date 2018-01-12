import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResearchHomeFrameComponent } from './research-home-frame.component';

describe('ResearchHomeFrameComponent', () => {
  let component: ResearchHomeFrameComponent;
  let fixture: ComponentFixture<ResearchHomeFrameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResearchHomeFrameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResearchHomeFrameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
