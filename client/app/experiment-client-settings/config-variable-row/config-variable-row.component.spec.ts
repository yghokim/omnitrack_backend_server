import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigVariableRowComponent } from './config-variable-row.component';

describe('ConfigVariableRowComponent', () => {
  let component: ConfigVariableRowComponent;
  let fixture: ComponentFixture<ConfigVariableRowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigVariableRowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigVariableRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
