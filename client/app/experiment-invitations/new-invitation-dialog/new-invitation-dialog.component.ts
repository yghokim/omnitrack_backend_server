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

  public isBusy = true

  public selectedTypeKey = AInvitation.SpecificGroupType
  public groups: Array<any>
  public selectedGroupId: string
  public selectedGroupIds: Array<string> = []

  public specificGroupType = AInvitation.SpecificGroupType
  public randomGroupType = AInvitation.RandomGroupType

  isPublic: boolean = false

  constructor(
    private dialogRef: MatDialogRef<NewInvitationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any) {

  }

  ngOnInit() {
    if(this.data.groups)
    {
      this.groups = this.data.groups
      if (this.groups.length > 0) {
        this.selectedGroupId = this.groups[0]._id
      }
      this.selectedGroupIds = this.groups.map(g => g._id)
    }
    /*
    this.api.selectedExperimentService.flatMap(service => {
      console.log(service)
      return service.getExperiment()}).subscribe(
      exp => {
        console.log(exp)
        this.isBusy = false
        this.groups = exp.groups
        if (this.groups.length > 0) {
          this.selectedGroupId = this.groups[0]._id
        }
        this.selectedGroupIds = this.groups.map(g => g._id)
      }
    )*/
  }

  onTabChanged(event) {
    switch (event.index) {
      case 0:
      this.selectedTypeKey = AInvitation.SpecificGroupType
      break;
      case 1:
      this.selectedTypeKey = AInvitation.RandomGroupType
      break;
    }
  }


  isSpecificGroupInvitationSelected(): boolean {
    return this.selectedTypeKey === AInvitation.SpecificGroupType
  }

  isRandomGroupInvitationSelected(): boolean {
    return this.selectedTypeKey === AInvitation.RandomGroupType
  }

  selectInvitationType(key) {
    this.selectedTypeKey = key
  }

  onGroupChecked(groupId, event) {
    const selectedIndex = this.selectedGroupIds.indexOf(groupId)
    if (event.checked === false) {
      if (selectedIndex !== -1) {
        this.selectedGroupIds.splice(selectedIndex, 1)
      }
    } else if (event.checked === true) {
      if (selectedIndex === -1) {
        this.selectedGroupIds.push(groupId)
      }
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
      let invitation: AInvitation
      switch (this.selectedTypeKey) {
        case AInvitation.SpecificGroupType:
          invitation = new SpecificGroupInvitation(this.selectedGroupId)
          break;
        case AInvitation.RandomGroupType:
          invitation = new RandomGroupInvitation(this.selectedGroupIds)
          break;
      }

      console.log({groupMechanism: invitation.toJson(), isPublic: this.isPublic})
      this.dialogRef.close({groupMechanism: invitation.toJson(), isPublic: this.isPublic})

      /*

      console.log(invitation.toJson())
      this.isBusy = true
      this.api.selectedExperimentService.flatMap(service => service.generateInvitation(invitation.toJson())).subscribe(
        newInvitation => {
          console.log(newInvitation)
          this.isBusy = true
          this.dialogRef.close(newInvitation)
        }
      )*/
    }
  }
}
