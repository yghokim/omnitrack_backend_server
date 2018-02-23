import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { NotificationService } from '../../services/notification.service';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-end-user-frame',
  template: '<router-outlet></router-outlet>'
})
export class EndUserFrameComponent implements OnInit {

  private readonly _internalSubscriptions = new Subscription()

  constructor(private notificationService: NotificationService, 
    private snackBar: MatSnackBar) { }

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

}
