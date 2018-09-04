import { Component, OnInit, OnDestroy } from "@angular/core";
import {
  Router,
  ActivatedRouteSnapshot,
  ActivatedRoute
} from "@angular/router";
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder
} from "@angular/forms";
import { ResearcherAuthService } from "../services/researcher.auth.service";
import { Subscription } from "rxjs";
import { makeMatchingPasswordFormGroup } from "../client-helper";

@Component({
  selector: "app-research-signup",
  templateUrl: "./research-signup.component.html",
  styleUrls: ["./research-signup.component.scss"]
})
export class ResearchSignupComponent implements OnInit, OnDestroy {
  private readonly _internalSubscriptions = new Subscription();

  registerForm: FormGroup;

  email = new FormControl("", [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(100)
  ]);
  password = new FormControl("", [
    Validators.required,
    Validators.minLength(6)
  ]);

  confirmPassword = new FormControl("", [
    Validators.required,
    Validators.minLength(6)
  ]);

  alias = new FormControl("", [Validators.required]);

  constructor(
    private formBuilder: FormBuilder,
    private authService: ResearcherAuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    const presetEmail = this.activatedRoute.snapshot.queryParamMap.get(
      "presetEmail"
    );
    if (presetEmail != null && presetEmail.length > 0) {
      this.email.setValue(presetEmail)
    }

    this.registerForm = this.formBuilder.group({
      email: this.email,
      alias: this.alias,
      matchingPassword: makeMatchingPasswordFormGroup(
        this.formBuilder, this.password, this.confirmPassword
      )
    });
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe();
  }

  register() {
    console.log("register");
    const credential = {
      email: this.registerForm.value.email,
      alias: this.registerForm.value.alias,
      password: this.registerForm.value.matchingPassword.password
    };
    this._internalSubscriptions.add(
      this.authService.register(credential).subscribe(res => {
        this.router.navigate(["/research"]);
      })
    );
  }

  setClassEmail() {
    return !this.email.pristine && !this.email.valid ? ":invalid" : ":valid";
  }

  setClassPassword() {
    return { "has-danger": !this.password.pristine && !this.password.valid };
  }

  setClassConfirmPassword() {
    return {
      "has-danger":
        !this.confirmPassword.pristine && !this.confirmPassword.valid
    };
  }
}
