import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { getIdPopulateCompat } from '../../../../omnitrack/core/db-entity-types';
import { IExperimentDbEntity } from '../../../../omnitrack/core/research/db-entity-types';

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
  experimentId: string

  original: {
    key: string,
    package: string,
    alias: string,
    experimentId: string
  }

  experiments: Array<IExperimentDbEntity>

  constructor(private dialogRef: MatDialogRef<UpdateClientSignatureDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any) {
    this._id = data._id

    this.original = {
      key: data.key,
      package: data.package,
      alias: data.alias,
      experimentId: getIdPopulateCompat(data.experiment, "_id") || "none"
    }

    this.key = data.key
    this.package = data.package
    this.alias = data.alias
    this.experimentId = getIdPopulateCompat(data.experiment, "_id") || "none"
    this.experiments = data.experiments
  }

  ngOnInit() {
  }

  onNoClick() {
    this.dialogRef.close(null)
  }

  onYesClick() {
    this.dialogRef.close({
      key: this.key,
      package: this.package,
      alias: this.alias,
      experiment: this.experimentId == "none" ? null : this.experimentId
    })
  }

  onExperimentSelectionChanged(event) {
    console.log(event)
  }

  isValid(): boolean {
    const valid = this.key != null && this.key.length > 0 && this.key.length < 1000
      && this.package != null && this.package.length > 0 && this.package.length < 100
      && this.alias != null && this.alias.length > 0 && this.alias.length < 30 && (this.original.key !== this.key || this.original.package !== this.package || this.original.alias !== this.alias || this.original.experimentId !== this.experimentId)
    return valid
  }

}
