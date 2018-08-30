import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-signature-validation-complete-dialog',
  templateUrl: './signature-validation-complete-dialog.component.html',
  styleUrls: ['./signature-validation-complete-dialog.component.scss']
})
export class SignatureValidationCompleteDialogComponent implements OnInit {

  public signature: string
  public packageName: string

  constructor(public dialogRef: MatDialogRef<SignatureValidationCompleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.signature = data.signature
    this.packageName = data.packageName    
  }

  ngOnInit() {
    
  }

  onYesClick(){
    this.dialogRef.close()
  }

}
