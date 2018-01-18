import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewExperimentDialogComponent } from './new-experiment-dialog.component';

describe('NewExperimentDialogComponent', () => {
  let component: NewExperimentDialogComponent;
  let fixture: ComponentFixture<NewExperimentDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewExperimentDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewExperimentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
