import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { D3ChartFrameComponent } from './d3-chart-frame.component';

describe('D3ChartFrameComponent', () => {
  let component: D3ChartFrameComponent;
  let fixture: ComponentFixture<D3ChartFrameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ D3ChartFrameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(D3ChartFrameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
