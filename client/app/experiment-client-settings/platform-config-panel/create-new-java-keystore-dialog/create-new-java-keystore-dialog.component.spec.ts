import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNewJavaKeystoreDialogComponent } from './create-new-java-keystore-dialog.component';

describe('CreateNewJavaKeystoreDialogComponent', () => {
  let component: CreateNewJavaKeystoreDialogComponent;
  let fixture: ComponentFixture<CreateNewJavaKeystoreDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateNewJavaKeystoreDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewJavaKeystoreDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
