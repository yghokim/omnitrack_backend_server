import { Component, OnInit } from '@angular/core';
import { ResearcherAuthService } from '../../services/researcher.auth.service';
import { Router } from '@angular/router';
import { NotificationService, ENotificationType } from '../../services/notification.service';
import { MatDialog, MatSnackBar } from '@angular/material';
import { YesNoDialogComponent } from '../../dialogs/yes-no-dialog/yes-no-dialog.component';
import { Subscription } from 'rxjs';
import { PlatformVersionCheckService } from '../../services/platform-version-check.service';

@Component({
  selector: 'app-research-layout',
  templateUrl: './research-layout.component.html',
  styleUrls: ['./research-layout.component.scss']
})
export class ResearchLayoutComponent implements OnInit {

  private readonly _internalSubscriptions = new Subscription()
  constructor(public authService: ResearcherAuthService,
    private notificationService: NotificationService,
    private versionCheckService: PlatformVersionCheckService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.versionCheckService.checkNewVersion().subscribe(
        checkResult => {
          if(checkResult.needUpdate === true){
            if(localStorage.getItem("lastNotifiedNewVersion") !== checkResult.newVersion){
              localStorage.setItem("lastNotifiedNewVersion", checkResult.newVersion)
              this.notificationService.showNotification(ENotificationType.INFO, "New version of the OmniTrack Research Kit is available! - Ver " + checkResult.newVersion)
            }
          }
        }
      )
    )
  }

  onAccountSettingsClicked(){
    this.router.navigate(["/research/account"])
  }

  onSignOutClicked() {
    const dialogRef = this.dialog.open(YesNoDialogComponent, {
      data: {
        title: 'Sign Out', message: 'Do you want to sign out?',
      }
    })
    this._internalSubscriptions.add(
      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.signOut()
        }
      })
    )
  }

  signOut() {
    this._internalSubscriptions.add(
      this.authService.signOut().subscribe(() => {
        console.log('successfully signed out.');
        this.goToSignIn();
      })
    )
  }

  goToSignIn() {
    this.router.navigate(['/research/login']).then(
      onFulfilled => {
        if (onFulfilled == true) {
          this.snackBar.open("Signed out from the research dashboard.", null, { duration: 3000 })
        }
      }
    )
  }
}
