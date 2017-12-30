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

  private positiveButtonClass = this.data.positiveButtonClass || "btn-primary"
  private negativeButtonClass = this.data.negativeButtonClass || "btn-danger"
  private positiveLabel = this.data.positiveLabel || "Yes"
  private negativeLabel = this.data.negativeLabel || "No"
  
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
