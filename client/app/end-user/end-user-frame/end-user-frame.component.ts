import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter, map, flatMap } from 'rxjs/operators';
import { NotificationService } from '../../services/notification.service';
import { MatSnackBar, MatDialog } from '@angular/material';
import { AngularFireAuth } from 'angularfire2/auth';
import { YesNoDialogComponent } from '../../dialogs/yes-no-dialog/yes-no-dialog.component';
import router from '../../../../server/router_research';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-end-user-frame',
  styleUrls: ['./end-user-frame.component.scss'],
  templateUrl: './end-user-frame.component.html'
})
export class EndUserFrameComponent implements OnInit, OnDestroy {

  title: string = ""

  private readonly _internalSubscriptions = new Subscription()

  constructor(private notificationService: NotificationService, private snackBar: MatSnackBar, public auth: AngularFireAuth, private dialog: MatDialog, private router: Router) {
    this._internalSubscriptions.add(
      this.router.events.pipe(
        filter(ev => ev instanceof NavigationEnd),
        map(_ => this.router.routerState.root),
        map(route => {
          while (route.firstChild) { route = route.firstChild; }
          return route;
        }),
        flatMap(route => route.data)
      ).subscribe(data => {
          this.title = data['title'];
        })
    )
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.notificationService.snackBarMessageQueue.subscribe(
        message => {
          console.log(message)
          if (message.action) {
            this.snackBar.open(message.message, message.action.label, { duration: 3000 })
          }
          else this.snackBar.open(message.message, null, { duration: 3000 })
        })
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  signOutClicked() {
    this.auth.auth.signOut().then(
      () => {
        this.router.navigate(["/tracking/login"])
      }
    )
  }

}
