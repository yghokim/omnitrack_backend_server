import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-task-loading-dialog',
  templateUrl: './task-loading-dialog.component.html',
  styleUrls: ['./task-loading-dialog.component.scss']
})
export class TaskLoadingDialogComponent implements OnInit {

  private _internalSubscription = new Subscription()

  public title = null
  public message = null

  public isProcessing = false

  constructor(public dialogRef: MatDialogRef<TaskLoadingDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: TaskLoadingDialogData) {

  }

  ngOnInit() {
    this.title = this.data.title
    this.message = this.data.message
    this.isProcessing = true
    this._internalSubscription.add(
      this.data.task.subscribe(result => {
        this.dialogRef.close(result)
      }, err => {
        if(this.data.onError)
          this.data.onError(err)
        
          this.dialogRef.close(null)
      }, ()=>{
        this.isProcessing = false
      })
    )
  }

  onCancelClick(): void {
    if(this.data.cancel)
      this.data.cancel()
    
      this.dialogRef.close(null)
  }

}

export interface TaskLoadingDialogData {
  title?: string
  message?: string
  task: Observable<any>
  cancel?: () => void
  onError?: (any) => void
}
