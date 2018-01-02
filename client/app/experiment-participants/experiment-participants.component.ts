import { Component, OnInit } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { Subscription } from 'rxjs/Subscription';
import { MatDialog } from '@angular/material';
import { YesNoDialogComponent } from '../dialogs/yes-no-dialog/yes-no-dialog.component';
import { ChooseInvitationDialogComponent } from '../dialogs/choose-invitation-dialog/choose-invitation-dialog.component';

@Component({
  selector: 'app-experiment-participants',
  templateUrl: './experiment-participants.component.html',
  styleUrls: ['./experiment-participants.component.scss']
})
export class ExperimentParticipantsComponent implements OnInit {

  private userPool: Array<any>
  private userPoolSubscription: Subscription = null
  private isLoadingUserPool = true

  private participants: Array<any>
  private participantsSubscription: Subscription = null
  private isLoadingParticipants = true

  private hoveredRowIndex = -1
  private hoveredParticipantId = null

  constructor(
    private api: ResearchApiService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.onParticipantsTabSelected()
  }

  onTabChanged(event) {
    this.hoveredRowIndex = -1
    switch (event.index) {
      case 0:
        this.onParticipantsTabSelected()
        break;
      case 1:
        this.onUserPoolTabSelected()
        break;
    }
  }

  onUserPoolTabSelected() {
    if (!this.userPoolSubscription || this.userPoolSubscription.closed) {
      this.isLoadingUserPool = true
      this.userPoolSubscription = this.api.getUserPool().subscribe(userPool => {
        this.userPool = userPool
        console.log(userPool)
        this.isLoadingUserPool = false
      })
    }
  }

  onParticipantsTabSelected() {
    if (!this.participantsSubscription || this.participantsSubscription.closed) {
      this.isLoadingParticipants = true
      this.participantsSubscription = this.api.selectedExperimentService.flatMap(expService => expService.getParticipants()).subscribe(
        participants => {
          console.log(participants)
          this.participants = participants
          this.isLoadingParticipants = false
        }
      )
    }
  }

  onSendInvitationClicked(userId: string) {
    this.dialog.open(ChooseInvitationDialogComponent, { data: { positiveLabel: "Send" } }).afterClosed().subscribe(
      invitationCode => {
        if (invitationCode) {
          this.api.selectedExperimentService.flatMap(exp => {
            exp.invalidateParticipants()
            return exp.sendInvitation(invitationCode, [userId], false)
          }).subscribe(result => {
            this.api.invalidateUserPool()
            this.participantsSubscription.unsubscribe()
            this.onUserPoolTabSelected()
          })
        }
      }
    )
  }

  onDeleteAccountClicked(userId: string) {
    this.dialog.open(YesNoDialogComponent, { data: { title: "Delete User Account", message: "Do you want to remove the user account from server? This process cannot be undone.", positiveLabel: "Delete", positiveButtonClass: "btn-danger", negativeButtonClass: "btn-primary" } }).beforeClose().subscribe(res => {
      if (res == true) {
        this.api.deleteUserAccount(userId, true).subscribe(result => {
          if (result == true) {
            this.api.invalidateUserPool()
            this.userPool.splice(this.userPool.findIndex((user) => user._id == userId), 1)
          }
        })
      }
    })
  }

  onDeleteParticipantClicked(participantId: string, title: string, message: string) {
    this.dialog.open(YesNoDialogComponent, {
      data: {
        title: title,
        message: message,
        positiveLabel: title,
        positiveClass: "btn-danger",
        negativeClass: "btn-primary",
      }
    }).afterClosed().subscribe(ok => {
      if (ok == true) {
        this.api.selectedExperimentService.flatMap(expService => {
          expService.invalidateParticipants()
          return expService.removeParticipant(participantId)
        }).subscribe(
          removed => {
            if (removed) {
              this.api.invalidateUserPool()
              this.participants.splice(this.participants.findIndex(part => part._id == participantId), 1)
            }
          }
          )
      }
    })
  }

  exractDemographics(user) {
    if (user.activatedRoles) {
      const role = user.activatedRoles.find(role => role.role == "ServiceUser")
      if (role) {
        return role.information.age + " (" + role.information.gender.charAt(0).toUpperCase() + ") in " + role.information.country
      }
    }
  }

  extractParticipantFromthisExperiment(user: any): any{
    return user.participantIdentities.find(participant => participant.invitation.experiment._id == this.api.getSelectedExperimentId())
  }

  hasPendingInvitationFromThisExperiment(user: any): boolean{
    const participant = this.extractParticipantFromthisExperiment(user)
    return participant != null && !participant.isDenied && !participant.isConsentApproved
  }

}
