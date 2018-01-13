import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartFrameComponent } from './chart-frame.component';

describe('ChartFrameComponent', () => {
  let component: ChartFrameComponent;
  let fixture: ComponentFixture<ChartFrameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChartFrameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartFrameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
