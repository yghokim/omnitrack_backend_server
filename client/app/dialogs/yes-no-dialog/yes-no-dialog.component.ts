import { Component, OnInit, Inject } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';

@Component({
  selector: 'app-yes-no-dialog',
  templateUrl: './yes-no-dialog.component.html',
  styleUrls: ['./yes-no-dialog.component.scss']
})
export class YesNoDialogComponent implements OnInit {

  public title = null
  public message = null

  public positiveButtonClass = this.data.positiveButtonClass || ""
  public negativeButtonClass = this.data.negativeButtonClass || ""
  public positiveLabel = this.data.positiveLabel || "Yes"
  public negativeLabel = this.data.negativeLabel || "No"
  public positiveColor = this.data.positiveColor || "primary"
  public negativeColor = this.data.negativeColor || "accent"


  constructor(public dialogRef: MatDialogRef<YesNoDialogComponent>,
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
