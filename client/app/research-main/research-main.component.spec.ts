import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResearchMainComponent } from './research-main.component';

describe('ResearchMainComponent', () => {
  let component: ResearchMainComponent;
  let fixture: ComponentFixture<ResearchMainComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResearchMainComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResearchMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
