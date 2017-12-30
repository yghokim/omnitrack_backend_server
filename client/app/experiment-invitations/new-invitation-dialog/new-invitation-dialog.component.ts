import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AInvitation, SpecificGroupInvitation, RandomGroupInvitation } from '../../../../omnitrack/core/research/invitation';
import { ResearchApiService } from '../../services/research-api.service';

@Component({
  selector: 'app-new-invitation-dialog',
  templateUrl: './new-invitation-dialog.component.html',
  styleUrls: ['./new-invitation-dialog.component.scss']
})
export class NewInvitationDialogComponent implements OnInit {

  private isBusy = true

  private invitationTypeList = [
    {
      key: AInvitation.SpecificGroupType,
      tab: "Specific Group"
    },
    {
      key: AInvitation.RandomGroupType,
      tab: "Random Group"
    }
  ]

  private selectedTypeKey = AInvitation.SpecificGroupType
  private groups: Array<any>
  private selectedGroupId: string
  private selectedGroupIds: Array<string> = []

  constructor(
    private api: ResearchApiService,
    private dialogRef: MatDialogRef<NewInvitationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any) {

  }

  ngOnInit() {
    this.api.selectedExperimentService.flatMap(service => service.getExperiment()).subscribe(
      exp => {
        this.isBusy = false
        this.groups = exp.groups
        if (this.groups.length > 0) {
          this.selectedGroupId = this.groups[0]._id
        }
        this.selectedGroupIds = this.groups.map(g => g._id)
      }
    )
  }

  isSpecificGroupInvitationSelected(): boolean {
    return this.selectedTypeKey == AInvitation.SpecificGroupType
  }

  isRandomGroupInvitationSelected(): boolean {
    return this.selectedTypeKey == AInvitation.RandomGroupType
  }

  selectInvitationType(key) {
    this.selectedTypeKey = key
  }

  onGroupChecked(groupId, checked) {
    const selectedIndex = this.selectedGroupIds.indexOf(groupId)
    if (checked == false) {
      if (selectedIndex != -1) {
        this.selectedGroupIds.splice(selectedIndex, 1)
      }
    }
    else if (checked == true) {
      if (selectedIndex == -1) {
        this.selectedGroupIds.push(groupId)
      }
    }
    console.log(this.selectedGroupIds)
  }

  onGroupSelected(groupId, checked) {
    if (checked == true) {
      this.selectedGroupId = groupId
    }
  }

  isGenerateAvailable(): boolean {
    switch (this.selectedTypeKey) {
      case AInvitation.SpecificGroupType:
        return this.selectedGroupId != null
      case AInvitation.RandomGroupType:
        return this.selectedGroupIds.length > 0
    }
  }

  generate() {
    if (this.isGenerateAvailable()) {
      var invitation: AInvitation
      switch (this.selectedTypeKey) {
        case AInvitation.SpecificGroupType:
          invitation = new SpecificGroupInvitation(this.selectedGroupId)
          break;
        case AInvitation.RandomGroupType:
          invitation = new RandomGroupInvitation(this.selectedGroupIds)
          break;
      }

      console.log(invitation.toJson())
      this.isBusy = true
      this.api.selectedExperimentService.flatMap(service=>service.generateInvitation(invitation.toJson())).subscribe(
        newInvitation=>{
          console.log(newInvitation)
          this.isBusy = true
          this.dialogRef.close(newInvitation)
        }
      )
    }
  }
}
