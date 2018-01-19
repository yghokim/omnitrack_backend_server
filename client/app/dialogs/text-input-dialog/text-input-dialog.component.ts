import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Observable } from "rxjs/Observable"
import { Subscription } from 'rxjs/Subscription'


@Component({
  selector: 'app-text-input-dialog',
  templateUrl: './text-input-dialog.component.html',
  styleUrls: ['./text-input-dialog.component.scss']
})
export class TextInputDialogComponent implements OnInit, OnDestroy {

  private title = ""
  private message = ""
  private placeholder = "Insert text"
  private textValue = ""
  private validator: (text: string) => boolean
  private submit: (text: string) => Observable<any>

  private positiveButtonClass = this.data.positiveButtonClass || ""
  private negativeButtonClass = this.data.negativeButtonClass || ""
  private positiveLabel = this.data.positiveLabel || "Yes"
  private negativeLabel = this.data.negativeLabel || "No"
  private positiveColor = this.data.positiveColor || "primary"
  private negativeColor = this.data.negativeColor || "accent"

  private submitErrorMessage: string = null

  private _internalSubscriptions = new Subscription()

  constructor(private dialogRef: MatDialogRef<TextInputDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    this.title = this.data.title
    this.message = this.data.message
    this.placeholder = this.data.placeholder
    this.textValue = this.data.prefill
    this.validator = this.data.validator
    this.submit = this.data.submit
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  onYesClick(): void {
    if (this.isValid() == true) {
      if (this.submit) {
        this._internalSubscriptions.add(
          this.submit(this.textValue).subscribe(
            result => {
              this.dialogRef.close(this.textValue)
            },
            err => {
              this.submitErrorMessage = err.error
            }
          )
        )
      } else this.dialogRef.close(this.textValue)
    }
  }

  onNoClick(): void {
    this.dialogRef.close(null);
  }

  isValid(): boolean {
    if (this.validator) {
      return this.validator(this.textValue)
    } else return true
  }

}
