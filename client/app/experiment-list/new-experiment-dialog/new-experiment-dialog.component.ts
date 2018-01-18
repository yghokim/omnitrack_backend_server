import { Component, OnInit } from '@angular/core';
import { isNullOrBlank } from '../../../../shared_lib/utils';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-new-experiment-dialog',
  templateUrl: './new-experiment-dialog.component.html',
  styleUrls: ['./new-experiment-dialog.component.scss']
})
export class NewExperimentDialogComponent implements OnInit {

  experimentName: string = null

  constructor(private dialogRef: MatDialogRef<NewExperimentDialogComponent>) { }

  ngOnInit() {
  }

  isValid():boolean{
    return isNullOrBlank(this.experimentName) === false
  }

  onNoClick(){
    this.dialogRef.close(null)
  }

  onYesClick(){
    if(this.isValid())
    {
      this.dialogRef.close({name: this.experimentName.trim()})
    }
  }
}

export type ExperimentCreationInfo = {
  name: string
}