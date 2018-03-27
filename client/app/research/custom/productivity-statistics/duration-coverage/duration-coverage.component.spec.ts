import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DurationCoverageComponent } from './duration-coverage.component';

describe('DurationCoverageComponent', () => {
  let component: DurationCoverageComponent;
  let fixture: ComponentFixture<DurationCoverageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DurationCoverageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DurationCoverageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
