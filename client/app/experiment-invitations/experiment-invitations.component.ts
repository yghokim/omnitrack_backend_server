import { Component, OnInit } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { ExperimentService } from '../services/experiment.service';
import { MatDialog } from '@angular/material';
import { NewInvitationDialogComponent } from './new-invitation-dialog/new-invitation-dialog.component';
import { AInvitation } from '../../../omnitrack/core/research/invitation';
import { YesNoDialogComponent } from '../dialogs/yes-no-dialog/yes-no-dialog.component';

@Component({
  selector: 'app-experiment-invitations',
  templateUrl: './experiment-invitations.component.html',
  styleUrls: ['./experiment-invitations.component.scss']
})
export class ExperimentInvitationsComponent implements OnInit {

  private experimentService: ExperimentService
  private invitations: Array<any>
  private groups: Array<any>
  private isLoadingInvitations = true

  private hoveredRowIndex = -1

  constructor(private api: ResearchApiService, private dialog: MatDialog) {
    this.api.selectedExperimentService.subscribe(expService => {
      this.experimentService = expService
    })
  }

  ngOnInit() {
    this.isLoadingInvitations = true
    this.api.selectedExperimentService.flatMap(service => service.getInvitations()).subscribe(
      invitations => {
        this.invitations = invitations
        console.log(invitations)
        this.isLoadingInvitations = false
      }
    )

    this.api.selectedExperimentService.flatMap(service => service.getExperiment()).map(exp => exp.groups).subscribe(groups => {
      this.groups = groups
    })
  }

  private getInvitationType(invitation): string {
    if (invitation.groupMechanism) {
      switch (invitation.groupMechanism.type) {
        case AInvitation.SpecificGroupType:
          return "Single Group"
        case AInvitation.RandomGroupType:
          return "Random Group"
      }
    } else return ""
  }

  onDeleteClicked(invitation: any) {
    this.dialog.open(YesNoDialogComponent, { data: { title: "Remove Invitation", message: "Do you want to remove invitation? This process cannot be undone.", positiveLabel: "Delete", positiveButtonClass: "btn-danger", negativeButtonClass: "btn-primary" } }).beforeClose().subscribe(res => {
      if (res == true) {
        this.experimentService.removeInvitation(invitation).subscribe(result => {
          if (result == true) {
            this.invitations.splice(this.invitations.findIndex((invit) => invit._id == invitation._id), 1)
          }
        })
      }
    })
  }

  onNewInvitationClicked() {
    this.dialog.open(NewInvitationDialogComponent, {}).beforeClose().subscribe(
      newInvitation => {
        if (newInvitation) {
          this.experimentService.invalidateInvitations()
          this.ngOnInit()
        }
      }
    )
  }

  getGroupName(groupId): string {
    return (this.groups.find(g => g._id == groupId) || {name:""}).name
  }

}
