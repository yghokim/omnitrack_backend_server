import { Component, OnInit } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { Subscription } from 'rxjs/Subscription';
import { MatDialog } from '@angular/material';
import { YesNoDialogComponent } from '../dialogs/yes-no-dialog/yes-no-dialog.component';
import { ChooseInvitationDialogComponent } from '../dialogs/choose-invitation-dialog/choose-invitation-dialog.component';
import { NewInvitationDialogComponent } from '../experiment-invitations/new-invitation-dialog/new-invitation-dialog.component';

@Component({
  selector: 'app-experiment-participants',
  templateUrl: './experiment-participants.component.html',
  styleUrls: ['./experiment-participants.component.scss']
})
export class ExperimentParticipantsComponent implements OnInit {

  public userPool: Array<any>
  public userPoolSubscription: Subscription = null
  public isLoadingUserPool = true

  public participants: Array<any>
  public participantsSubscription: Subscription = null
  public isLoadingParticipants = true

  public hoveredRowIndex = -1
  public hoveredParticipantId = null

  constructor(
    public api: ResearchApiService,
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
    this.api.selectedExperimentService.flatMap(expService => expService.getInvitations()).subscribe(list => {
      if (list.length > 0) { // Has invitations. Show selection window.
        this.dialog.open(ChooseInvitationDialogComponent, { data: { positiveLabel: "Send" } }).afterClosed().subscribe(
          invitationCode => {
            if (invitationCode) {
              this.api.selectedExperimentService.flatMap(exp => {
                return exp.sendInvitation(invitationCode, [userId], false)
              }).subscribe(result => {
                this.participantsSubscription.unsubscribe()
                this.onUserPoolTabSelected()
              })
            }
          }
        )
      } else {
        // No invitation. Ask to make the invitation.
        this.dialog.open(YesNoDialogComponent, { data: {
          title: "No Invitation",
          message: "There are no invitations to current experiment. Do you want to create a new one and invite the user?",
          positiveLabel: "Create New Invitation"
        } }).afterClosed().subscribe(yes => {
          if (yes === true) {
            this.dialog.open(NewInvitationDialogComponent, {}).afterClosed().subscribe(newInvitation => {
              if (newInvitation) {
                this.api.selectedExperimentService.flatMap(exp => {
                  return exp.sendInvitation(newInvitation.code, [userId], false)
                }).subscribe(result => {
                  this.participantsSubscription.unsubscribe()
                  this.onUserPoolTabSelected()
                })
              }
            })
          }
        })
      }
    })
  }

  onDeleteAccountClicked(userId: string) {
    this.dialog.open(YesNoDialogComponent, { data: { title: "Delete User Account", message: "Do you want to remove the user account from server? This process cannot be undone.", positiveLabel: "Delete", positiveColor: "warn", negativeColor: "primary" } }).beforeClose().subscribe(res => {
      if (res === true) {
        this.api.deleteUserAccount(userId, true).subscribe(result => {
          if (result === true) {
            this.userPool.splice(this.userPool.findIndex((user) => user._id === userId), 1)
          }
        })
      }
    })
  }

  onCancelInvitationClicked(participantId: string) {
    this.dialog.open(YesNoDialogComponent, {
      data: {
        title: 'Cancel Invitation',
        message:  'Do you want to cancel the pending invitation to the user?',
        positiveLabel: 'Cancel Invitation',
        positiveColor: "warn",
        negativeColor: "primary",
      }
    }).afterClosed().subscribe(ok => {
      if (ok === true) {
        this.api.selectedExperimentService.flatMap(expService => expService.removeParticipant(participantId))
          .subscribe(
          removed => {
            if (removed) {
              this.participants.splice(this.participants.findIndex(part => part._id === participantId), 1)
            }
          }
          )
      }
    })
  }

  onDropParticipantClicked(participantId: string){
    this.dialog.open(YesNoDialogComponent, {
      data: {
        title: 'Drop Participant',
        message:  'Do you want to drop the participant from this experiment?',
        positiveLabel: 'Drop',
        positiveColor: "warn",
        negativeColor: "primary",
      }
    }).afterClosed().subscribe(ok => {
      if (ok === true) {
        this.api.selectedExperimentService.flatMap(expService => expService.dropParticipant(participantId))
          .subscribe(
          removed => {
            if (removed) {
              this.participants.splice(this.participants.findIndex(part => part._id === participantId), 1)
            }
          }
          )
      }
    })
  }

  exractDemographics(user) {
    if (user.activatedRoles) {
      const role = user.activatedRoles.find(r => r.role === "ServiceUser")
      if (role) {
        return role.information.age + " (" + role.information.gender.charAt(0).toUpperCase() + ") in " + role.information.country
      }
    }
  }

  extractParticipantFromthisExperiment(user: any): any {
    return user.participantIdentities.find(participant => participant.invitation.experiment._id === this.api.getSelectedExperimentId())
  }

  isParticipatingInAnotherExperiment(user: any): any {
    return user.participantIdentities.find(participant => !participant.isDenied && participant.isConsentApproved && participant.invitation.experiment._id !== this.api.getSelectedExperimentId()) != null
  }

  hasPendingInvitationFromThisExperiment(user: any): boolean {
    return user.participantIdentities.find(participant =>
      !participant.isDenied && !participant.isConsentApproved && participant.invitation.experiment._id === this.api.getSelectedExperimentId()) != null
  }

  isParticipatingInThisExperiment(user: any): boolean {
    return user.participantIdentities.find(participant =>
      !participant.isDenied && participant.isConsentApproved && participant.invitation.experiment._id === this.api.getSelectedExperimentId()) != null
  }

}
