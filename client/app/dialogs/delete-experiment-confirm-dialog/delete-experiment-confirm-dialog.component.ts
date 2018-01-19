import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { isNullOrBlank } from '../../../../shared_lib/utils';

@Component({
  selector: 'app-delete-experiment-confirm-dialog',
  templateUrl: './delete-experiment-confirm-dialog.component.html',
  styleUrls: ['./delete-experiment-confirm-dialog.component.scss']
})
export class DeleteExperimentConfirmDialogComponent implements OnInit {

  experimentIdConfirm: string

  constructor(private dialogRef: MatDialogRef<DeleteExperimentConfirmDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
   }

  ngOnInit() {
  }

  onYesClick(){
    if(this.isValid())
    {
      this.dialogRef.close(this.data.experimentId)
    }
  }

  isValid(): boolean{
    return isNullOrBlank(this.experimentIdConfirm) !== true && this.experimentIdConfirm === this.data.experimentId
  }

  onNoClick(){
    this.dialogRef.close(false)
  }

}
