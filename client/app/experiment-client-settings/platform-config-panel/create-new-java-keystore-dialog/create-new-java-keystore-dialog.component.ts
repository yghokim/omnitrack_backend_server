import { Component, OnInit, Inject } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder
} from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { makeMatchingPasswordFormGroup } from '../../../client-helper';

@Component({
  selector: 'app-create-new-java-keystore-dialog',
  templateUrl: './create-new-java-keystore-dialog.component.html',
  styleUrls: ['./create-new-java-keystore-dialog.component.scss']
})
export class CreateNewJavaKeystoreDialogComponent implements OnInit {

  keytoolForm: FormGroup;

  storePassword = new FormControl("", [
    Validators.required,
    Validators.minLength(6)
  ]);
  confirmStorePassword = new FormControl("", [
    Validators.required,
    Validators.minLength(6)
  ]);


  keyPassword = new FormControl("", [
    Validators.required,
    Validators.minLength(6)
  ]);

  confirmKeyPassword = new FormControl("", [
    Validators.required,
    Validators.minLength(6)
  ]);


  alias = new FormControl("omnitrack", [
    Validators.required
  ]);

  year = new FormControl(25)

  name = new FormControl(null)
  organUnit = new FormControl(null)
  organ = new FormControl(null)
  city = new FormControl(null)
  province = new FormControl(null)
  countryCode = new FormControl(null)

  constructor( private formBuilder: FormBuilder, public dialogRef: MatDialogRef<CreateNewJavaKeystoreDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    this.keytoolForm = this.formBuilder.group({
      matchingStorePassword: makeMatchingPasswordFormGroup(this.formBuilder, this.storePassword, this.confirmStorePassword),
      alias: this.alias,
      validity: this.year,
      matchingKeyPassword: makeMatchingPasswordFormGroup(this.formBuilder, this.keyPassword, this.confirmKeyPassword),
      name: this.name,
      organizationalUnit: this.organUnit,
      organization: this.organ,
      city: this.city,
      province: this.province,
      countryCode: this.countryCode
    })
  }

  onYesClick(){
  }

  onNoClick(){
    this.dialogRef.close(null)
  }

}
