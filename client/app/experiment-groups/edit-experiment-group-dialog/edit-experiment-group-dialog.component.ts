import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { IExperimentGroupDbEntity, IExperimentDbEntity } from '../../../../omnitrack/core/research/db-entity-types';
import { deepclone } from '../../../../shared_lib/utils';

@Component({
  selector: 'app-edit-experiment-group-dialog',
  templateUrl: './edit-experiment-group-dialog.component.html',
  styleUrls: ['./edit-experiment-group-dialog.component.scss']
})
export class EditExperimentGroupDialogComponent implements OnInit {

  private readonly originalModel: IExperimentGroupDbEntity
  public readonly model: IExperimentGroupDbEntity

  public readonly experimentInfo: IExperimentDbEntity

  isEditMode(): boolean {
    return this.model._id != null
  }

  constructor(private dialogRef: MatDialogRef<EditExperimentGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any) {
    if (data.model) {
      this.originalModel = data.model
      this.model = deepclone(data.model)
    } else this.model = {
      _id: null,
      name: null,
      trackingPackageKey: null
    }
    this.experimentInfo = data.experimentInfo
  }

  ngOnInit() {
  }

  isChangeValid(): boolean {
    if (this.model != null) {
      return (this.isEditMode() === true && (this.originalModel.name !== this.model.name || this.originalModel.trackingPackageKey !== this.model.trackingPackageKey)) || this.isEditMode() === false && this.model.name != null && this.model.name.length > 0
    } else return false
  }

  onNoClick() {
    this.dialogRef.close(null)
  }

  onYesClick() {
    if(this.isChangeValid() === true){
      this.dialogRef.close(this.model)
    }
  }
}
