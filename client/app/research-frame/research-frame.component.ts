import { Component, OnInit } from '@angular/core';
import { ResearcherAuthService } from '../services/researcher.auth.service';
import { NotificationService } from '../services/notification.service';
import { Router } from '@angular/router';
import { ResearchApiService } from '../services/research-api.service';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material';
import { ResearcherAuthGuardSecure } from '../services/researcher.auth.guard.secure';
import { ResearcherAuthGuardMain } from '../services/researcher.auth.guard.main';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'app-research-frame',
  templateUrl: './research-frame.component.html',
  styleUrls: ['./research-frame.component.scss']
})
export class ResearchFrameComponent implements OnInit {

  private readonly _internalSubscriptions = new Subscription()

  constructor(private notificationService: NotificationService, 
    private snackBar: MatSnackBar) { }

  ngOnInit() {


    this._internalSubscriptions.add(
      this.notificationService.snackBarMessageQueue.subscribe(
        message => {
          if (message.action) {
            this.snackBar.open(message.message, message.action.label, { duration: 3000 })
          }
          else this.snackBar.open(message.message, null, { duration: 3000 })
        })
    )
  }
}
