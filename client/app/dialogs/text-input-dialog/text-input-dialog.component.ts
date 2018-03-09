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

  public title = ""
  public message = ""
  public placeholder = "Insert text"
  public textValue = ""
  private validator: (text: string) => boolean
  private submit: (text: string) => Observable<any>

  public positiveButtonClass = this.data.positiveButtonClass || ""
  public negativeButtonClass = this.data.negativeButtonClass || ""
  public positiveLabel = this.data.positiveLabel || "Yes"
  public negativeLabel = this.data.negativeLabel || "No"
  public positiveColor = this.data.positiveColor || "primary"
  public negativeColor = this.data.negativeColor || "accent"

  public submitErrorMessage: string = null

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
