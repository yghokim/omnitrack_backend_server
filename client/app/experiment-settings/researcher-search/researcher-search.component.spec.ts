import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResearcherSearchComponent } from './researcher-search.component';

describe('ResearcherSearchComponent', () => {
  let component: ResearcherSearchComponent;
  let fixture: ComponentFixture<ResearcherSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResearcherSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResearcherSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
