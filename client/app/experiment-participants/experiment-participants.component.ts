import { Component, OnInit } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
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

  activeParticipantCount(){
    if(!this.participants) return 0
    return this.participants.filter(participant => participant.dropped!=true && participant.isConsentApproved==true).length
  }

  droppedParticipantCount(){
    if(!this.participants) return 0
    return this.participants.filter(participant => participant.dropped==true).length
  }

  pendingInviteeCount(){
    if(!this.participants) return 0
    return this.participants.filter(participant => participant.isDenied!=true&&participant.isConsentApproved!=true&&participant.dropped!=true).length
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
        this.isLoadingUserPool = false
      })
    }
  }

  onParticipantsTabSelected() {
    if (!this.participantsSubscription || this.participantsSubscription.closed) {
      this.isLoadingParticipants = true
      this.participantsSubscription = this.api.selectedExperimentService.flatMap(expService => expService.getParticipants()).subscribe(
        participants => {
          this.participants = participants
          this.isLoadingParticipants = false
        }
      )
    }
  }

  onSendInvitationClicked(userId: string) {
    this.api.selectedExperimentService.flatMap(expService => 
      Observable.zip(expService.getInvitations(), expService.getExperiment())).subscribe(result => {
        const invitations = result[0]
        const groups = result[1].groups
      if (invitations.length > 0) { // Has invitations. Show selection window.
        this.dialog.open(ChooseInvitationDialogComponent, { data: { 
          groups: groups,
          invitations: invitations,
          positiveLabel: "Send" } }).afterClosed().subscribe(
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
            this.dialog.open(NewInvitationDialogComponent, {data: {groups: groups}}).afterClosed().subscribe(newInvitation => {
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
    this.deleteParticipant(participantId, 
      'Cancel Invitation', 
      'Do you want to cancel the pending invitation to the user?')
  }

  onRemoveParticipantEntryClicked(participantId: string){
    this.deleteParticipant(participantId,
      'Delete Participation Entry',
      'Do you want to remove this participation entry?',
      'Delete'
    )
  }

  private deleteParticipant(participantId: string, title: string, message: string, positiveLabel: string = title){
    this.dialog.open(YesNoDialogComponent, {
      data: {
        title: title,
        message:  message,
        positiveLabel: positiveLabel,
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


  isParticipatingInAnotherExperiment(user: any): any {
    return user.participantIdentities.find(participant => !participant.isDenied && participant.isConsentApproved && participant.invitation.experiment._id !== this.api.getSelectedExperimentId()) != null
  }

  getParticipationStatus(participant: any): string
  {
    if(participant.isDenied == true)
      {
        return 'denied'
      }
      else if(participant.dropped == true)
      {
        return 'dropped'
      }
      else if(participant.isConsentApproved == true)
      {
        return 'participating'
      }
      else return 'pending'
  }

  getParticipationStatusToThisExperimentOfUser(user: any): string
  {
    const participant = user.participantIdentities.find(participant => participant.invitation.experiment._id === this.api.getSelectedExperimentId()) 
    if(participant)
    {
      return this.getParticipationStatus(participant)
    } else { return null } 
  }

}
