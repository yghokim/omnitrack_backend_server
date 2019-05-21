import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { ExperimentService } from '../services/experiment.service';
import { NotificationService } from '../services/notification.service';
import { MatDialog } from '@angular/material';
import { NewInvitationDialogComponent } from './new-invitation-dialog/new-invitation-dialog.component';
import { AInvitation } from '../../../omnitrack/core/research/invitation';
import { YesNoDialogComponent } from '../dialogs/yes-no-dialog/yes-no-dialog.component';
import { Subscription } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';

@Component({
  selector: 'app-experiment-invitations',
  templateUrl: './experiment-invitations.component.html',
  styleUrls: ['./experiment-invitations.component.scss']
})
export class ExperimentInvitationsComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()
  public experimentService: ExperimentService
  public invitations: Array<any>
  public groups: Array<any>
  public isLoadingInvitations = true

  public hoveredRowIndex = -1

  constructor(
    private api: ResearchApiService,
    private notificationService: NotificationService,
    private dialog: MatDialog) {
    this.api.selectedExperimentService.subscribe(expService => {
      this.experimentService = expService
    })
  }

  ngOnInit() {
    this.isLoadingInvitations = true
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(flatMap(service => service.getInvitations())).subscribe(
        invitations => {
          this.invitations = invitations
        },
        err => {

        },
        () => {
          this.isLoadingInvitations = false
        }
      )
    )

    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(
        flatMap(service => service.getExperiment()),
        map(exp => exp.groups)
      ).subscribe(groups => {
        this.groups = groups
      })
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
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

  onDeleteClicked(invitation: any) {
    this.dialog.open(YesNoDialogComponent, { data: { title: "Remove Invitation", message: "Do you want to remove invitation?<br>This process cannot be undone.", positiveLabel: "Delete", positiveColor: "warn", negativeColor: "primary" } }).beforeClose().subscribe(res => {
      if (res === true) {
        this.experimentService.removeInvitation(invitation).subscribe(result => {
          if (result === true) {
          }
        })
      }
    })
  }

  onInvitationCodeCopied(invitation) {
    this.notificationService.pushSnackBarMessage({ message: "Copied the invitation code to clipboard." })
  }

  onNewInvitationClicked() {
    this._internalSubscriptions.add(
      this.dialog.open(NewInvitationDialogComponent, { data: { groups: this.groups } }).beforeClose().subscribe(
        information => {
          if (information) {
            this.isLoadingInvitations = true
            this._internalSubscriptions.add(
              this.api.selectedExperimentService.pipe(flatMap(service => service.generateInvitation(information))).subscribe(
                newInvitation => {
                },
                (err) => {
                  try {
                    const errObj = err.error
                    if (errObj.code === 11000) {
                      // duplicate code error
                      this.notificationService.pushSnackBarMessage({
                        message: "There already exists an invitation with the same code."
                      })
                    }
                  } catch (ex) {
                    console.error(ex)
                  }
                },
                () => {
                  this.isLoadingInvitations = false
                }
              )
            )
          }
        }
      )
    )
  }

  getGroupName(groupId): string {
    return (this.groups.find(g => g._id === groupId) || { name: "" }).name
  }

  getNumActiveParticipants(invitation): number {
    const participants = invitation.participants
    if (participants instanceof Array) {
      return participants.filter(p => p.dropped !== true).length
    } else { return 0 }
  }

}
