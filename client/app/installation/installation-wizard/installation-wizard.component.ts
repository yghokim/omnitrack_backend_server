import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { map } from "rxjs/operators";
import { Http } from "@angular/http";
import { Router } from "@angular/router";

@Component({
  selector: "app-installation-wizard",
  templateUrl: "./installation-wizard.component.html",
  styleUrls: ["./installation-wizard.component.scss"]
})
export class InstallationWizardComponent implements OnInit, OnDestroy {
  private readonly internalSubscriptions = new Subscription();

  superUsersComplete = false;
  jwtTokenComplete = false;
  firebaseCertComplete = false;

  isInstallationCompletable = false;

  isSubmittingFirebaseCert = false;
  isSubmittingJwtToken = false;
  isSubmittingSuperUsers = false;
  isLoadingServerStatus = true;

  currentStepIndex = 0;

  private _superUsers: Array<string> = [];
  set superUsers(arr: Array<string>) {
    this._superUsers = arr;
  }

  get superUsers(): Array<string> {
    return this._superUsers;
  }

  private jwtTokenSecretExample = "ChangeThisString";
  jwtTokenSecret = "ChangeThisString";

  adminCertJson: any = null;
  adminCertFile: any;
  wrongCertFileUploaded = false;

  public newInputSuperUser = null;
  public isNewInputSuperUserValid = true;

  emailValidator = (email: string) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  constructor(private http: Http, private router: Router) {}

  ngOnInit() {
    this.isLoadingServerStatus = true;
    this.internalSubscriptions.add(
      this.http
        .get("/api/installation/status/each")
        .pipe(map(res => res.json()))
        .subscribe(
          result => {
            this.handleSummaryResult(result);
            console.log(result);
          },
          err => {
            console.log(err);
            if (err.error === "AlreadyInstalled") {
              this.router.navigate(["research/signup"]);
            }
          },
          () => {
            this.isLoadingServerStatus = false;
          }
        )
    );
  }

  ngOnDestroy(): void {
    this.internalSubscriptions.unsubscribe();
  }

  private handleSummaryResult(result: any) {
    this.superUsersComplete = result.flags.super_users || false;
    this.firebaseCertComplete = result.flags.firebase_cert || false;
    this.jwtTokenComplete = result.flags.jwt_secret || false;
    this.isInstallationCompletable = result.completable;
    this.jumpToTheFirstAvailableStep();
  }

  private jumpToTheFirstAvailableStep() {
    const flags = [
      this.superUsersComplete,
      this.firebaseCertComplete,
      this.jwtTokenComplete
    ];
    this.currentStepIndex = 0;
    flags.forEach((f, i) => {
      if (f === true) {
        this.currentStepIndex++;
      }
    });
    console.log("next index: " + this.currentStepIndex);
  }

  isNewSuperUserTextValid(): boolean {
    return this.emailValidator(this.newInputSuperUser);
  }

  onKeyDownInNewSuperUser(ev) {
    if (ev.keyCode === 13) {
      this.onAddNewSuperUserClicked();
    }
  }

  onAddNewSuperUserClicked() {
    if (this.isNewSuperUserTextValid()) {
      if (
        this.superUsers &&
        this.superUsers.indexOf(this.newInputSuperUser) === -1
      ) {
        this.superUsers.push(this.newInputSuperUser);
      } else {
        this.superUsers = [this.newInputSuperUser];
      }
      this.newInputSuperUser = null;
      this.isNewInputSuperUserValid = true;
    } else {
      this.isNewInputSuperUserValid = false;
    }
  }

  onRemoveSuperUserClicked(user: string) {
    if (this.superUsers) {
      const index = this.superUsers.indexOf(user);
      if (index !== -1) {
        this.superUsers.splice(index, 1);
      }
    }
  }

  onAdminCertFileChanged(files) {
    this.wrongCertFileUploaded = false;
    if (files.length > 0) {
      const fileReader = new FileReader();
      fileReader.onload = e => {
        try {
          this.adminCertJson = JSON.parse((e as any).target.result);
          if (this.checkFileValid(this.adminCertJson) !== true) {
            this.wrongCertFileUploaded = true;
            this.adminCertJson = null;
          }
        } catch (e) {
          console.log(e);
          this.adminCertJson = null;
        }
      };
      fileReader.readAsText(files[0]);
    }
  }

  onTryAnotherCertFileClicked() {
    this.adminCertFile = null;
    this.adminCertJson = null;
  }

  onSuperUsersEdited(event) {
    this.superUsers = this.superUsers.filter(
      u => this.emailValidator(u) === true
    );
  }

  private checkFileValid(obj: any): boolean {
    return (
      obj["type"] != null &&
      obj["project_id"] != null &&
      obj["private_key_id"] != null &&
      obj["private_key"] != null
    );
  }

  isJwtTokenSecretValid(): boolean {
    return (
      this.jwtTokenSecret !== this.jwtTokenSecretExample &&
      this.jwtTokenSecret &&
      this.jwtTokenSecret.length > 0
    );
  }

  submitFirebaseCert() {
    this.internalSubscriptions.add(
      this.http
        .post("/api/installation/set/firebase_cert", {
          value: this.adminCertJson
        })
        .pipe(map(res => res.json()))
        .subscribe(result => {
          console.log(result);
          this.firebaseCertComplete = result.success;
          this.isInstallationCompletable = result.completable;
          this.jumpToTheFirstAvailableStep();
        })
    );
  }

  submitSuperUsers() {
    this.internalSubscriptions.add(
      this.http
        .post("/api/installation/set/super_users", {
          value: this.superUsers
        })
        .pipe(map(res => res.json()))
        .subscribe(result => {
          this.superUsersComplete = result.success;
          this.isInstallationCompletable = result.completable;
          this.jumpToTheFirstAvailableStep();
        })
    );
  }

  submitJwtTokenSecret() {
    this.internalSubscriptions.add(
      this.http
        .post("/api/installation/set/jwt_secret", {
          value: this.jwtTokenSecret
        })
        .pipe(map(res => res.json()))
        .subscribe(result => {
          this.jwtTokenComplete = result.success;
          this.isInstallationCompletable = result.completable;
          this.jumpToTheFirstAvailableStep();
        })
    );
  }

  startOver() {
    this.internalSubscriptions.add(
      this.http
        .post("/api/installation/reset", {})
        .pipe(map(res => res.json()))
        .subscribe(result => {
          this.handleSummaryResult(result);
        })
    );
  }

  completeInstallation() {
    this.isLoadingServerStatus = true;
    this.internalSubscriptions.add(
      this.http
        .post("/api/installation/set/complete_installation", { value: true })
        .pipe(map(res => res.json()))
        .subscribe(
          success => {
            if (success === true) {
              this.router.navigate(["research/signup"], {queryParams: {presetEmail: this.superUsers[0]}});
            }
          },
          err => {},
          () => {
            this.isLoadingServerStatus = false;
          }
        )
    );
  }
}
