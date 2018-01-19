import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteExperimentConfirmDialogComponent } from './delete-experiment-confirm-dialog.component';

describe('DeleteExperimentConfirmDialogComponent', () => {
  let component: DeleteExperimentConfirmDialogComponent;
  let fixture: ComponentFixture<DeleteExperimentConfirmDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeleteExperimentConfirmDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteExperimentConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
