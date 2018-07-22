import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditExperimentGroupDialogComponent } from './edit-experiment-group-dialog.component';

describe('EditExperimentGroupDialogComponent', () => {
  let component: EditExperimentGroupDialogComponent;
  let fixture: ComponentFixture<EditExperimentGroupDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditExperimentGroupDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditExperimentGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
