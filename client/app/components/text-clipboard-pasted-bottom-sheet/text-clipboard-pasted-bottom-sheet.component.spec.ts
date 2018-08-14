import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextClipboardPastedBottomSheetComponent } from './text-clipboard-pasted-bottom-sheet.component';

describe('TextClipboardPastedBottomSheetComponent', () => {
  let component: TextClipboardPastedBottomSheetComponent;
  let fixture: ComponentFixture<TextClipboardPastedBottomSheetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextClipboardPastedBottomSheetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextClipboardPastedBottomSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
