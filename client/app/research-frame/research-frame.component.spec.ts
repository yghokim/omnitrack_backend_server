import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResearchFrameComponent } from './research-frame.component';

describe('ResearchFrameComponent', () => {
  let component: ResearchFrameComponent;
  let fixture: ComponentFixture<ResearchFrameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResearchFrameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResearchFrameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
