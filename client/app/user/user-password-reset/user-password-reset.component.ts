import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { flatMap } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { makeMatchingPasswordFormGroup } from '../../client-helper';

@Component({
  selector: 'app-user-password-reset',
  templateUrl: './user-password-reset.component.html',
  styleUrls: ['./user-password-reset.component.scss']
})
export class UserPasswordResetComponent implements OnInit, OnDestroy {

  public isLoading = true

  public systemErrorMessage: string = null

  public passwordResetComplete: boolean = false

  private _internalSubscriptions = new Subscription()

  private token: string = null

  password = new FormControl("", [Validators.required, Validators.minLength(4)])

  confirmPassword = new FormControl("", [Validators.required, Validators.minLength(4)])

  passwordForm: FormGroup

  constructor(activatedRoute: ActivatedRoute, private http: HttpClient, private formBuilder: FormBuilder) {

    this.passwordForm = makeMatchingPasswordFormGroup(this.formBuilder, this.password, this.confirmPassword)


    this.token = activatedRoute.snapshot.queryParamMap.get("token")

    if (this.token) {
      this.systemErrorMessage = null
    } else {
      this.systemErrorMessage = "Invalid link. Check you've connected using a valid link."
    }
    this.isLoading = false
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }

  public getInputValidationClass(property: string) {
    const control = this[property] as FormControl
    if (control.pristine === true) {
      return null
    } else if (control.valid === true) {
      return 'is-valid'
    } else return 'is-invalid'
  }

  public onClosePageClicked(){
    window.close()
  }

  public submit() {
    this.passwordForm.updateValueAndValidity()
    if (this.passwordForm.valid === true) {
      this._internalSubscriptions.add(
        this.http.post<boolean>("/api/user/auth/reset_password",
          {
            token: this.token,
            password: this.password.value
          }
        ).subscribe(changed => {
          console.log("password was changed successfully.")
          this.passwordResetComplete = true
          this.systemErrorMessage = null
        }, err => {
          if (err.error && err.error.error) {
            switch (err.error.error) {
              case "TokenExpired":
                this.systemErrorMessage = "The password reset link was expired already. Please issue a new link and try again."
                break;
              case "AccountNotExists":
                this.systemErrorMessage = "Invalid link. Check you've connected using a valid link (This link is of no use anymore)."
                break;
            }
          }
        })
      )
    }
  }
}
