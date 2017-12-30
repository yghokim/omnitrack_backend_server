import { Component, OnInit } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { Subscription } from 'rxjs/Subscription';
import { MatDialog } from '@angular/material';
import { YesNoDialogComponent } from '../dialogs/yes-no-dialog/yes-no-dialog.component';

@Component({
  selector: 'app-experiment-participants',
  templateUrl: './experiment-participants.component.html',
  styleUrls: ['./experiment-participants.component.scss']
})
export class ExperimentParticipantsComponent implements OnInit {

  private userPool: Array<any>
  private userPoolSubscription : Subscription = null
  private isLoadingUserPool = true
  private hoveredRowIndex = -1

  constructor(
    private api: ResearchApiService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    
  }

  onTabChanged(event){
    this.hoveredRowIndex = -1
    if(event.index == 1)
    {
      this.onUserPoolSelected()
    }
  }

  onUserPoolSelected(){
    if(!this.userPoolSubscription || this.userPoolSubscription.closed)
    {
      this.isLoadingUserPool = true
      this.userPoolSubscription = this.api.getUserPool().subscribe(userPool=>{
        this.userPool = userPool
        console.log(this.userPool)
        this.isLoadingUserPool = false
      })
    }
  }

  onDeleteAccountClicked(userId: string) {
    this.dialog.open(YesNoDialogComponent, { data: { title: "Delete User Account", message: "Do you want to remove the user account from server? This process cannot be undone.", positiveLabel: "Delete", positiveButtonClass: "btn-danger", negativeButtonClass: "btn-primary" } }).beforeClose().subscribe(res => {
      if (res == true) {
        this.api.deleteUserAccount(userId, true).subscribe(result => {
          if (result == true) {
            this.userPool.splice(this.userPool.findIndex((user) => user._id == userId), 1)
          }
        })
      }
    })
  }

  exractDemographics(user){
    if(user.activatedRoles)
    {
      const role = user.activatedRoles.find(role => role.role == "ServiceUser")
      if(role)
      {
        return role.information.age + " (" + role.information.gender.charAt(0) + ") in " + role.information.country 
      }
    }
  }

}
