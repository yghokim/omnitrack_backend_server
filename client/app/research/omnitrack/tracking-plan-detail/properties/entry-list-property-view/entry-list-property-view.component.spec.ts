import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EntryListPropertyViewComponent } from './entry-list-property-view.component';

describe('EntryListPropertyViewComponent', () => {
  let component: EntryListPropertyViewComponent;
  let fixture: ComponentFixture<EntryListPropertyViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EntryListPropertyViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntryListPropertyViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
