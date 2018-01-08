import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from "@angular/router";
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { ResearcherAuthService } from '../services/researcher.auth.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-research-signup',
  templateUrl: './research-signup.component.html',
  styleUrls: ['./research-signup.component.scss']
})
export class ResearchSignupComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  registerForm: FormGroup;

  email = new FormControl('', [Validators.required,
  Validators.minLength(3),
  Validators.maxLength(100)]);
  password = new FormControl('', [Validators.required,
  Validators.minLength(6)]);

  confirmPassword = new FormControl('', [Validators.required,
  Validators.minLength(6)]);

  alias = new FormControl('', [Validators.required]);

  constructor(private formBuilder: FormBuilder, private authService: ResearcherAuthService, private router: Router) { }

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      email: this.email,
      alias: this.alias,
      matchingPassword: this.formBuilder.group({
        password: this.password,
        confirmPassword: this.confirmPassword
      }, {
          validator: (group: FormGroup) => {
            const passwordInput = group.controls["password"]
            const confirmPasswordInput = group.controls["confirmPassword"]
            if (passwordInput.value !== confirmPasswordInput.value) {
              return confirmPasswordInput.setErrors({ passwordNotMatch: true })
            } else { return null }
          }
        })
    })
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  register() {
    console.log("register")
    const credential = {
      email: this.registerForm.value.email,
      alias: this.registerForm.value.alias,
      password: this.registerForm.value.matchingPassword.password
    }
    this._internalSubscriptions.add(
      this.authService.register(credential).subscribe(
        res => {
          this.router.navigate(['/research'])
        })
    )
  }

  setClassEmail() {
    return (!this.email.pristine && !this.email.valid) ? ":invalid" : ":valid";
  }

  setClassPassword() {
    return { 'has-danger': !this.password.pristine && !this.password.valid };
  }

  setClassConfirmPassword() {
    return { 'has-danger': !this.confirmPassword.pristine && !this.confirmPassword.valid };
  }
}
