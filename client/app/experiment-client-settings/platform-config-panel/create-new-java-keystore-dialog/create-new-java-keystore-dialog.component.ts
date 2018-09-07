import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder
} from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { makeMatchingPasswordFormGroup } from '../../../client-helper';
import { deepclone } from '../../../../../shared_lib/utils';
import { Subscription } from 'rxjs';
import { ClientBuildService } from '../../../services/client-build.service';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-create-new-java-keystore-dialog',
  templateUrl: './create-new-java-keystore-dialog.component.html',
  styleUrls: ['./create-new-java-keystore-dialog.component.scss']
})
export class CreateNewJavaKeystoreDialogComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  public isGenerating = false

  public keytoolForm: FormGroup;

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

  year = new FormControl(25, [Validators.min(1)])

  name = new FormControl(null, [Validators.required])
  organUnit = new FormControl(null, [Validators.required])
  organ = new FormControl(null, [Validators.required])
  city = new FormControl(null, [Validators.required])
  province = new FormControl(null, [Validators.required])
  countryCode = new FormControl(null, [Validators.required])

  private buildService: ClientBuildService

  constructor(private formBuilder: FormBuilder, public dialogRef: MatDialogRef<CreateNewJavaKeystoreDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.buildService = data.clientBuildService
   }

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

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  onNoClick() {
    this._internalSubscriptions.unsubscribe()
    this.dialogRef.close(null)
  }

  getValidationClass(key: string) {
    return !this[key].valid ? "is-invalid" : ":valid";
  }

  submitKeystore(){
    this.keytoolForm.updateValueAndValidity()
    if(this.keytoolForm.valid===true){
      const formValue = deepclone(this.keytoolForm.value)
      formValue.keyPassword = formValue.matchingKeyPassword.password
      formValue.storePassword = formValue.matchingStorePassword.password
      console.log("submit java keystore form.")
      this.isGenerating = true
      this._internalSubscriptions.add(
        this.buildService.generateJavaKeystore(formValue).subscribe(
          blob=>{
            console.log(blob)
            FileSaver.saveAs(blob, 'keystore.jks')
            this.dialogRef.close()
          },
          err => {
            console.error(err)
          }
        )
      )
    }
    else{
      console.log("form is invalid.")
    }
  }

}
