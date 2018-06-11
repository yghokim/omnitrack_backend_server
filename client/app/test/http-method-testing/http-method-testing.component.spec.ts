import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpMethodTestingComponent } from './http-method-testing.component';

describe('HttpMethodTestingComponent', () => {
  let component: HttpMethodTestingComponent;
  let fixture: ComponentFixture<HttpMethodTestingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HttpMethodTestingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HttpMethodTestingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
