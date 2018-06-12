import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-update-client-signature-dialog',
  templateUrl: './update-client-signature-dialog.component.html',
  styleUrls: ['./update-client-signature-dialog.component.scss']
})
export class UpdateClientSignatureDialogComponent implements OnInit {

  _id: string
  key: string
  package: string
  alias: string = "Android-Debug"

  original: {
    key: string,
    package: string,
    alias: string
  }

  constructor(private dialogRef: MatDialogRef<UpdateClientSignatureDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any) {
    this._id = data._id

    this.original = {
      key: data.key,
      package: data.package,
      alias: data.alias
    }

    this.key = data.key
    this.package = data.package
    this.alias = data.alias
  }

  ngOnInit() {
  }

  onNoClick() {
    this.dialogRef.close(null)
  }

  onYesClick(){
    this.dialogRef.close({
      key: this.key,
      package: this.package,
      alias: this.alias
    })
  }

  isValid(): boolean{
    const valid = this.key!=null && this.key.length > 0 && this.key.length < 1000
     && this.package!=null && this.package.length > 0 && this.package.length < 100
     && this.alias!=null && this.alias.length > 0 && this.alias.length < 30 && (this.original.key !== this.key || this.original.package!==this.package || this.original.alias !== this.alias)
     return valid
  }

}
