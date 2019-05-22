import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl, Validators, FormBuilder, AbstractControl } from '@angular/forms';
import { IExperimentDbEntity, IExperimentGroupDbEntity } from '../../../../omnitrack/core/research/db-entity-types';
import { IUserDbEntity } from '../../../../omnitrack/core/db-entity-types';
import { Subscription } from 'rxjs';
import { ResearchApiService } from '../../services/research-api.service';
import { flatMap } from 'rxjs/operators';

export interface CreateUserAccountDialogData {
  experiment: IExperimentDbEntity
  participants: Array<IUserDbEntity>
  api: ResearchApiService
}

function containsValidator(list: Array<any>) {
  return function (control: AbstractControl) {
    if (list.indexOf(control.value) >= 0) {
      return null
    } else {
      return {
        listMember: true
      }
    }
  }
}

function noDuplicateValidator(list: Array<any>) {
  return function (control: AbstractControl) {
    if (list.indexOf(control.value) >= 0) {
      return {
        noDuplicate: true
      }
    } else {
      return null
    }
  }
}

@Component({
  selector: 'app-create-user-account-dialog',
  templateUrl: './create-user-account-dialog.component.html',
  styleUrls: ['./create-user-account-dialog.component.scss']
})
export class CreateUserAccountDialogComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()

  public hasSubmitted = false

  public userAccountForm: FormGroup;

  public isProcessing = false

  password = new FormControl("", [Validators.required, Validators.minLength(4)])

  username = new FormControl("", [Validators.required, Validators.minLength(3), Validators.maxLength(50), noDuplicateValidator(this.data.participants.map(p => p.username))])

  alias = new FormControl("", [
    noDuplicateValidator(this.data.participants.map(p => p.participationInfo.alias).filter(a => a != null))
  ])

  groupId = new FormControl(this.getGroups()[0]._id, [Validators.required, containsValidator(this.data.experiment.groups.map(g => g._id))])


  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<CreateUserAccountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateUserAccountDialogData) {
  }

  ngOnInit() {
    this.userAccountForm = this.formBuilder.group({
      username: this.username,
      password: this.password,
      alias: this.alias,
      groupId: this.groupId
    })
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  getGroups(): Array<IExperimentGroupDbEntity> {
    return this.data.experiment.groups
  }

  onNoClick() {
    this.dialogRef.close(null)
  }

  onYesClick() {
    this.hasSubmitted = true
    this.userAccountForm.updateValueAndValidity()
    if (this.userAccountForm.valid === true) {
      this.isProcessing = true
      this._internalSubscriptions.add(
        this.data.api.selectedExperimentService.pipe(
          flatMap(expService => expService.createParticipantAccount(
            this.userAccountForm.value.username,
          this.userAccountForm.value.password,
          this.userAccountForm.value.groupId,
          this.userAccountForm.value.alias))).subscribe(result => {
          this.dialogRef.close(this.userAccountForm.value)
        }, err => {
          console.error(err)
          this.isProcessing = false
        })
      )
    }
  }

  getValidationClass(key: string) {
    return (!this[key].valid && this.hasSubmitted === true) ? "is-invalid" : ":valid";
  }
}
