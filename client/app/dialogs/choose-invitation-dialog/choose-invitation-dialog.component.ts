import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { ResearchApiService } from '../../services/research-api.service';
import { AInvitation, SpecificGroupInvitation, RandomGroupInvitation } from '../../../../omnitrack/core/research/invitation';

@Component({
  selector: 'app-choose-invitation-dialog',
  templateUrl: './choose-invitation-dialog.component.html',
  styleUrls: ['./choose-invitation-dialog.component.scss']
})
export class ChooseInvitationDialogComponent implements OnInit {

  public positiveLabel = this.data.positiveLabel || "Send"

  private groups: Array<any>
  public invitations: Array<any>

  private selectedInvitationCode: string

  constructor(
    private dialogRef: MatDialogRef<ChooseInvitationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any) {
  }

  ngOnInit() {
    this.groups = this.data.groups
    this.invitations = this.data.invitations

    if (this.invitations.length > 0) {
      this.selectedInvitationCode = this.invitations[0].code
    }

    /*
    this.api.selectedExperimentService.flatMap(expService => expService.getExperiment()).map(exp => exp.groups).subscribe(groups => {
      this.groups = groups
    })

    this.api.selectedExperimentService.flatMap(expService => expService.getInvitations())
      .subscribe(invitations => {
        this.invitations = invitations
        if (this.invitations.length > 0) {
          this.selectedInvitationCode = this.invitations[0].code
        }
      })*/
  }

  private getInvitationType(invitation): string {
    if (invitation.groupMechanism) {
      switch (invitation.groupMechanism.type) {
        case AInvitation.SpecificGroupType:
          return "Single Group"
        case AInvitation.RandomGroupType:
          return "Random Group"
      }
    } else { return "" }
  }

  getGroupName(groupId): string {
    return (this.groups.find(g => g._id === groupId) || {name: ""}).name
  }

  onNoClick() {
    this.dialogRef.close()
  }

  onYesClick() {
    this.dialogRef.close(this.selectedInvitationCode)
  }

}
