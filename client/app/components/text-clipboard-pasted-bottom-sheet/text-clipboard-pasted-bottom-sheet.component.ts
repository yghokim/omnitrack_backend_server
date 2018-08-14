import { Component, OnInit, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from "@angular/material/bottom-sheet";

@Component({
  selector: 'app-text-clipboard-pasted-bottom-sheet',
  templateUrl: './text-clipboard-pasted-bottom-sheet.component.html',
  styleUrls: ['./text-clipboard-pasted-bottom-sheet.component.scss']
})
export class TextClipboardPastedBottomSheetComponent implements OnInit {

  public message: string = "Copy this text to the clipboard."
  public content: string = null

  constructor(private bottomSheetRef: MatBottomSheetRef<TextClipboardPastedBottomSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) private data: any) {
      if(data){
        if(data.message){
          this.message = data.message
        }
        if(data.content){
          this.content = data.content
        }
      }
  }

  ngOnInit() {
  }

  onCopied(){
    this.bottomSheetRef.dismiss(true)
  }
}
