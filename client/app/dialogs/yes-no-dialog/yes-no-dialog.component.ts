import { Component, OnInit, Inject } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';

@Component({
  selector: 'app-yes-no-dialog',
  templateUrl: './yes-no-dialog.component.html',
  styleUrls: ['./yes-no-dialog.component.scss']
})
export class YesNoDialogComponent implements OnInit {

  private title: string = ""
  private message: string = ""

  private positiveButtonClass = this.data.positiveButtonClass || ""
  private negativeButtonClass = this.data.negativeButtonClass || ""
  private positiveLabel = this.data.positiveLabel || "Yes"
  private negativeLabel = this.data.negativeLabel || "No"
  private positiveColor = this.data.positiveColor || "primary"
  private negativeColor = this.data.negativeColor || "accent"
  

  constructor(private dialogRef: MatDialogRef<YesNoDialogComponent>, 
    @Inject(MAT_DIALOG_DATA) public data: any) {
     }

  ngOnInit() {
    this.title = this.data.title
    this.message = this.data.message
  }

  onYesClick(): void {
    this.dialogRef.close(true)
  }
  
  onNoClick(): void {
    this.dialogRef.close(false);
  }

}
