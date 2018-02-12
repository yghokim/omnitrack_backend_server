import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientDownloadComponent } from './client-download.component';

describe('ClientDownloadComponent', () => {
  let component: ClientDownloadComponent;
  let fixture: ComponentFixture<ClientDownloadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClientDownloadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientDownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
