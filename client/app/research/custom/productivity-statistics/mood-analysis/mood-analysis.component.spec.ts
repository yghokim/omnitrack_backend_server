import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MoodAnalysisComponent } from './mood-analysis.component';

describe('MoodAnalysisComponent', () => {
  let component: MoodAnalysisComponent;
  let fixture: ComponentFixture<MoodAnalysisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MoodAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MoodAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
