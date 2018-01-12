import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResearchLayoutComponent } from './research-layout.component';

describe('ResearchLayoutComponent', () => {
  let component: ResearchLayoutComponent;
  let fixture: ComponentFixture<ResearchLayoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResearchLayoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResearchLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
