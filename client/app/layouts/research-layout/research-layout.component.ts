import { Component, OnInit, trigger, state, style, transition, animate, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ResearcherAuthService } from '../../services/researcher.auth.service';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { ResearchApiService } from '../../services/research-api.service';
import { NotificationService } from '../../services/notification.service';
import ExperimentInfo from '../../models/experiment-info';
import { MatDialog, MatIconRegistry, MatSnackBar } from '@angular/material';
import { YesNoDialogComponent } from '../../dialogs/yes-no-dialog/yes-no-dialog.component';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-research-layout',
  templateUrl: './research-layout.component.html',
  styleUrls: ['./research-layout.component.scss']
})
export class ResearchLayoutComponent implements OnInit {

  private readonly _internalSubscriptions = new Subscription()
  constructor(public authService: ResearcherAuthService,
    private notificationService: NotificationService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    private iconRegistry: MatIconRegistry,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
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
      this.authService.signOut().subscribe((signedOut) => {
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
