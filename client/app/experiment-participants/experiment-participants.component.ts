import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { Subscription, zip, empty } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import { MatDialog, MatTableDataSource, MatSort } from '@angular/material';
import { YesNoDialogComponent } from '../dialogs/yes-no-dialog/yes-no-dialog.component';
import { TextInputDialogComponent } from '../dialogs/text-input-dialog/text-input-dialog.component';
import { NotificationService } from '../services/notification.service';
import { IParticipantDbEntity } from '../../../omnitrack/core/db-entity-types';
import { ParticipantExcludedDaysConfigDialogComponent } from '../dialogs/participant-excluded-days-config-dialog/participant-excluded-days-config-dialog.component';


@Component({
  selector: 'app-experiment-participants',
  templateUrl: './experiment-participants.component.html',
  styleUrls: ['./experiment-participants.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentParticipantsComponent implements OnInit, OnDestroy {

  readonly PARTICIPANT_COLUMNS = ['alias', 'email', 'status', 'rangeStart', 'excludedDays', 'joined', 'lastSync', 'lastSession', 'userId', 'button']

  public participants: Array<any>
  public isLoadingParticipants = true

  public hoveredRowIndex = -1
  public hoveredParticipantId = null

  public screenExpanded = false

  public participantDataSource: MatTableDataSource<any>;
  @ViewChild(MatSort) participantSort: MatSort;

  private readonly _internalSubscriptions = new Subscription()

  constructor(
    public api: ResearchApiService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private detector: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.isLoadingParticipants = true
    this._internalSubscriptions.add(this.api.selectedExperimentService.pipe(flatMap(expService => expService.getParticipants())).subscribe(
      participants => {
        this.participants = participants
        this.isLoadingParticipants = false
        this.participantDataSource = new MatTableDataSource(participants)
        this.setSortParticipants();
        this.detector.markForCheck()
      }
    ))
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  activeParticipantCount() {
    if (!this.participants) { return 0 }
    return this.participants.filter(participant => participant.dropped !== true && participant.isConsentApproved === true).length
  }

  droppedParticipantCount() {
    if (!this.participants) { return 0 }
    return this.participants.filter(participant => participant.dropped === true).length
  }

  onRemoveParticipantEntryClicked(participantId: string) {
    this.deleteParticipant(participantId,
      'Delete Participation Entry',
      'Do you want to remove this participation entry?',
      'Delete'
    )
  }

  private deleteParticipant(participantId: string, title: string, message: string, positiveLabel: string = title) {
    this._internalSubscriptions.add(
      this.dialog.open(YesNoDialogComponent, {
        data: {
          title: title,
          message: message,
          positiveLabel: positiveLabel,
          positiveColor: "warn",
          negativeColor: "primary",
        }
      }).afterClosed().subscribe(ok => {
        if (ok === true) {
          this.api.selectedExperimentService.pipe(flatMap(expService => expService.removeParticipant(participantId)))
            .subscribe(
              removed => {
                if(removed===true){
                  this.notificationService.pushSnackBarMessage({message: "Removed the participant entry."})
                }
              }
            )
        }
      })
    )
  }

  onDropParticipantClicked(participantId: string) {
    this._internalSubscriptions.add(
      this.dialog.open(YesNoDialogComponent, {
        data: {
          title: 'Drop Participant',
          message: 'Do you want to drop the participant from this experiment?',
          positiveLabel: 'Drop',
          positiveColor: "warn",
          negativeColor: "primary",
        }
      }).afterClosed().subscribe(ok => {
        if (ok === true) {
          this.api.selectedExperimentService.pipe(flatMap(expService => expService.dropParticipant(participantId)))
            .subscribe(
              removed => {
                if (removed===true) {
                  this.notificationService.pushSnackBarMessage({message: "Dropped the participant."})
                }
              })
        }
      })
    )
  }

  onChangeAliasClicked(participant: any) {
    this._internalSubscriptions.add(
      this.dialog.open(TextInputDialogComponent, {
        data: {
          title: "Change Alias",
          positiveLabel: "Change",
          prefill: participant.alias,
          placeholder: "Insert new alias",
          validator: (text) => {
            return (text || "").length > 0 && text.trim() !== participant.alias
          },
          submit: (text) => this.api.selectedExperimentService.pipe(flatMap(service => service.changeParticipantAlias(participant._id, text.trim())))
        }
      }).afterClosed().subscribe(
        () => {
        }
      )
    )
  }

  onChangeExperimentRangeStartInput(newDate: Date, participant) {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(flatMap(service => service.updateParticipant(participant._id, { "experimentRange.from": newDate.getTime() }))).subscribe(
        () => {
          this.notificationService.pushSnackBarMessage({ message: "Modified the experiment start date of the participant." });
        },
        err => {
          console.log(err)
        }
      ))
  }

  onExcludedDaysEditClicked(participant: IParticipantDbEntity) {
    this._internalSubscriptions.add(
      this.dialog.open(ParticipantExcludedDaysConfigDialogComponent, {
        data: {
          dates: participant.excludedDays || []
        }
      }).afterClosed().pipe(flatMap(
        (newDates: Array<Date>) => {
          if (newDates) {
            return this.api.selectedExperimentService.pipe(flatMap(expService => expService.setParticipantExcludedDays(participant._id, newDates)))
          } else { return empty() }
        }
      )).subscribe(result => {
        if (result.success === true) {
        }
      })
    )
  }



  getParticipationStatus(participant: any): string {
    if (participant.dropped === true) {
      return 'dropped'
    } else { return 'participating' }
  }

  setSortParticipants(): void {
    this.participantDataSource.sort = this.participantSort;
    this.participantDataSource.sortingDataAccessor = (data: IParticipantDbEntity, sortHeaderId: string) => {
      if (data) {
        switch (sortHeaderId) {
          case "alias": { return data.alias || ''; }
          case "email": { if (data.user) { return data.user.email || ''; } break; }
          case "status": {
            if (data.dropped) { return 2; } else { return 1; }
          }
          case "excludedDays":
            if (data.excludedDays) {
              return data.excludedDays.length
            } else { return '' }
          case "rangeStart": { if (data.experimentRange) { return data.experimentRange.from } break; }
          case "joined": { return data.approvedAt || '' }
          case "created": { if (data.user) { return data.user.accountCreationTime || ''; } break; }
          case "lastSync": return data.lastSyncTimestamp || '';
          case "lastSession": return data.lastSessionTimestamp || '';
          case "userId": { if (data.user) { return data.user._id || ''; } break; }
          default: { return ''; }
        }
      }
      return '';
    }
  }
}
