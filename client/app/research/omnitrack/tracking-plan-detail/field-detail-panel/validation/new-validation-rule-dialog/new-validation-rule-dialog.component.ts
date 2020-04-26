import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ValidatorSpec, getValidatorSpec } from '../../../../../../../../omnitrack/core/fields/validators/validation-helper';
import { IFieldValidationDbEntity } from '../../../../../../../../omnitrack/core/db-entity-types';

@Component({
  selector: 'app-new-validation-rule-dialog',
  templateUrl: './new-validation-rule-dialog.component.html',
  styleUrls: ['./new-validation-rule-dialog.component.scss']
})
export class NewValidationRuleDialogComponent implements OnInit {

  public supportedValidatorSpecs: Array<ValidatorSpec>

  public validator: IFieldValidationDbEntity

  constructor(private dialogRef: MatDialogRef<NewValidationRuleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    this.supportedValidatorSpecs = this.data.supportedValidatorSpecs
    if (this.supportedValidatorSpecs.length > 0) {
      this.validator = {
        type: this.supportedValidatorSpecs[0].type
      }
    }
  }

  getSpecOfCurrentValidator(): ValidatorSpec {
    return this.supportedValidatorSpecs.find(s => s.type === this.validator.type)
  }

  onYesClick(): void {
    this.dialogRef.close(this.validator)
  }

  onNoClick(): void {
    this.dialogRef.close(null);
  }

}
