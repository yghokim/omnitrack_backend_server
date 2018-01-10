import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResearcherSearchComponentComponent } from './researcher-search-component.component';

describe('ResearcherSearchComponentComponent', () => {
  let component: ResearcherSearchComponentComponent;
  let fixture: ComponentFixture<ResearcherSearchComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResearcherSearchComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResearcherSearchComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
