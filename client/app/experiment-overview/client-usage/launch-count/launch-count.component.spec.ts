import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LaunchCountComponent } from './launch-count.component';

describe('LaunchCountComponent', () => {
  let component: LaunchCountComponent;
  let fixture: ComponentFixture<LaunchCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LaunchCountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LaunchCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
