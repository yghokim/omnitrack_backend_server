import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EndUserSignInComponent } from './end-user-sign-in.component';

describe('EndUserSignInComponent', () => {
  let component: EndUserSignInComponent;
  let fixture: ComponentFixture<EndUserSignInComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EndUserSignInComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EndUserSignInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
