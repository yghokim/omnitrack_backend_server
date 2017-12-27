import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResearchLoginComponent } from './research-login.component';

describe('ResearchLoginComponent', () => {
  let component: ResearchLoginComponent;
  let fixture: ComponentFixture<ResearchLoginComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResearchLoginComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResearchLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
