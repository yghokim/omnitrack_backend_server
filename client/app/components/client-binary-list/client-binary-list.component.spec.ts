import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientBinaryListComponent } from './client-binary-list.component';

describe('ClientBinaryListComponent', () => {
  let component: ClientBinaryListComponent;
  let fixture: ComponentFixture<ClientBinaryListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClientBinaryListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientBinaryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
