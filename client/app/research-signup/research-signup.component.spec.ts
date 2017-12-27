import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResearchSignupComponent } from './research-signup.component';

describe('ResearchSignupComponent', () => {
  let component: ResearchSignupComponent;
  let fixture: ComponentFixture<ResearchSignupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResearchSignupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResearchSignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
