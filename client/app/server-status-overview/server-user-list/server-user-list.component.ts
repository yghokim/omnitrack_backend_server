import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { ResearchApiService } from '../../services/research-api.service';
import { NotificationService } from '../../services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { YesNoDialogComponent } from '../../dialogs/yes-no-dialog/yes-no-dialog.component';

@Component({
  selector: 'app-server-user-list',
  templateUrl: './server-user-list.component.html',
  styleUrls: ['./server-user-list.component.scss']
})
export class ServerUserListComponent implements OnInit, OnDestroy {

  readonly USER_COLUMNS = ['email', 'status', 'demographic', 'created', 'signIn', 'userId', 'button']

  private readonly _internalSubscriptions = new Subscription()

  public userPool: Array<any>
  public userPoolSubscription: Subscription = null
  public isLoadingUserPool = true

  public userPoolDataSource: MatTableDataSource<any>;
  @ViewChild('userpoolTable', { read: MatSort }) userPoolSort: MatSort;

  constructor( public api: ResearchApiService,
    private notificationService: NotificationService,
    private dialog: MatDialog) { }

  ngOnInit() {
    if (!this.userPoolSubscription || this.userPoolSubscription.closed) {
      this.isLoadingUserPool = true
      this.userPoolSubscription = this.api.getUserPool().subscribe(userPool => {
        this.userPool = userPool
        this.isLoadingUserPool = false
        this.userPoolDataSource = new MatTableDataSource(userPool)
        this.setSortUsers();
      })
    }
  }

  ngOnDestroy() {
    if (this.userPoolSubscription) { this.userPoolSubscription.unsubscribe() }
    this._internalSubscriptions.unsubscribe()
  }

  setSortUsers(): void {
    this.userPoolDataSource.sort = this.userPoolSort;
    this.userPoolDataSource.sortingDataAccessor = (data: any, sortHeaderId: string) => {
      if (data) {
        switch (sortHeaderId) {
          case "status": {
            return this.getNumExperiment(data)
          }
          case "created": { return data.accountCreationTime || ''; }
          case "signIn": { return data.accountLastSignInTime || ''; }
          case "userId": { return data._id || ''; }
          case "email": { return data.email || ''; }
          case "demographic": { return this.exractDemographics(data) || '' }
          default: { return ''; }
        }
      }
    }
  }


  getParticipationStatusToThisExperimentOfUser(user: any): string {
    const participant = user.participantIdentities.find(p => {
      if (p.invitation !== null) {
        return p.invitation.experiment._id === this.api.getSelectedExperimentId()
      } else { return false }
    })

    if (participant) {
      return this.getParticipationStatus(participant)
    } else { return null }
  }

  getParticipationStatus(participant: any): string {
    if (participant.isDenied === true) {
      return 'denied'
    } else if (participant.dropped === true) {
      return 'dropped'
    } else if (participant.isConsentApproved === true) {
      return 'participating'
    } else { return 'pending' }
  }

  exractDemographics(user) {
    if (user.activatedRoles) {
      const role = user.activatedRoles.find(r => r.role === "ServiceUser")
      if (role) {
        return role.information.age + " (" + role.information.gender.charAt(0).toUpperCase() + ") in " + role.information.country
      }
    }
  }

  getNumExperiment(user: any): number {
    return user.participantIdentities.filter(participant => !participant.isDenied && participant.isConsentApproved).length
  }

  onDeleteAccountClicked(userId: string) {
    this._internalSubscriptions.add(
      this.dialog.open(YesNoDialogComponent, { data: { title: "Delete User Account", message: "Do you want to remove the user account from server? This process cannot be undone.", positiveLabel: "Delete", positiveColor: "warn", negativeColor: "primary" } }).beforeClose().subscribe(res => {
        if (res === true) {
          this.api.deleteUserAccount(userId, true).subscribe(result => {
            if (result === true) {
              this.userPool.splice(this.userPool.findIndex((user) => user._id === userId), 1)
            }
          })
        }
      })
    )
  }

}
