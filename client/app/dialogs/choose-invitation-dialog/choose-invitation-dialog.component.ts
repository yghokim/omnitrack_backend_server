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

  private positiveLabel = this.data.positiveLabel || "Send"

  private groups: Array<any>
  private invitations: Array<any>

  private selectedInvitationCode: string

  constructor(
    private api: ResearchApiService,
    private dialogRef: MatDialogRef<ChooseInvitationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any) {
  }

  ngOnInit() {
    this.api.selectedExperimentService.flatMap(expService=> expService.getExperiment()).map(exp=>exp.groups).subscribe(groups=>
    {
      this.groups = groups
    })

    this.api.selectedExperimentService.flatMap(expService => expService.getInvitations())
      .subscribe(invitations => {
        this.invitations = invitations
        if (this.invitations.length > 0) {
          this.selectedInvitationCode = this.invitations[0].code
        }
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

  getGroupName(groupId): string {
    return (this.groups.find(g => g._id == groupId) || {name:""}).name
  }

  onNoClick() {
    this.dialogRef.close()
  }

  onYesClick() {
    console.log(this.selectedInvitationCode)
    this.dialogRef.close(this.selectedInvitationCode)
  }

}
