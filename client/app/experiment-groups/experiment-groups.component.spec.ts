import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperimentGroupsComponent } from './experiment-groups.component';

describe('ExperimentGroupsComponent', () => {
  let component: ExperimentGroupsComponent;
  let fixture: ComponentFixture<ExperimentGroupsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExperimentGroupsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExperimentGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
