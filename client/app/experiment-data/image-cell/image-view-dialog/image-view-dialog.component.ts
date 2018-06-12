import { Component, OnInit, Input, Inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'image-view-dialog',
    templateUrl: 'image-view-dialog.component.html',
    styleUrls: ['./image-view-dialog.component.scss']
  })
  export class ImageViewDialog {
    constructor(
      public dialogRef: MatDialogRef<ImageViewDialog>,
      @Inject(MAT_DIALOG_DATA) public data: any){ }
  
    close(): void {
      this.dialogRef.close()
    }
    
  }