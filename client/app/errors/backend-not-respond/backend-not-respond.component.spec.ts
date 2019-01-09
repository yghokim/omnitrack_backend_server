import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BackendNotRespondComponent } from './backend-not-respond.component';

describe('BackendNotRespondComponent', () => {
  let component: BackendNotRespondComponent;
  let fixture: ComponentFixture<BackendNotRespondComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BackendNotRespondComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackendNotRespondComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
