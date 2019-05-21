import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { Subscription, empty } from 'rxjs';
import { flatMap, tap } from 'rxjs/operators';
import { MatDialog, MatTableDataSource, MatSort } from '@angular/material';
import { YesNoDialogComponent } from '../dialogs/yes-no-dialog/yes-no-dialog.component';
import { TextInputDialogComponent } from '../dialogs/text-input-dialog/text-input-dialog.component';
import { NotificationService } from '../services/notification.service';
import { IUserDbEntity } from '../../../omnitrack/core/db-entity-types';
import { ParticipantExcludedDaysConfigDialogComponent } from '../dialogs/participant-excluded-days-config-dialog/participant-excluded-days-config-dialog.component';


@Component({
  selector: 'app-experiment-participants',
  templateUrl: './experiment-participants.component.html',
  styleUrls: ['./experiment-participants.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentParticipantsComponent implements OnInit, OnDestroy {

  readonly PARTICIPANT_COLUMNS = ['alias', 'username', 'status', 'rangeStart', 'excludedDays', 'joined', 'lastSync', 'lastSession', 'userId', 'button']

  public participants: Array<IUserDbEntity>
  public isLoadingParticipants = true
  public isLoadingSessionSummary = true

  public hoveredRowIndex = -1
  public hoveredParticipantId = null

  public screenExpanded = false

  public participantDataSource: MatTableDataSource<IUserDbEntity>;
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
    this._internalSubscriptions.add(this.api.selectedExperimentService.pipe(
      flatMap(expService => expService.getParticipants()
        .pipe(
          tap(participants => {
            this.participants = participants
            this.isLoadingParticipants = false
            this.participantDataSource = new MatTableDataSource(participants)
            this.setSortParticipants();
            this.detector.markForCheck()
          }),
          flatMap(participants => expService.updateLatestTimestampsOfParticipants()))
      )).subscribe(
        () => {
          this.isLoadingSessionSummary = false
          this.detector.markForCheck()
        }
      ))
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  activeParticipantCount() {
    if (!this.participants) { return 0 }
    return this.participants.filter(participant => participant.participationInfo.dropped !== true).length
  }

  droppedParticipantCount() {
    if (!this.participants) { return 0 }
    return this.participants.filter(participant => participant.participationInfo.dropped === true).length
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
                if (removed === true) {
                  this.notificationService.pushSnackBarMessage({ message: "Removed the participant entry." })
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
                if (removed === true) {
                  this.notificationService.pushSnackBarMessage({ message: "Dropped the participant." })
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
            return (text || "").length > 0 && text.trim() !== participant.participationInfo.alias
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

  onExcludedDaysEditClicked(participant: IUserDbEntity) {
    this._internalSubscriptions.add(
      this.dialog.open(ParticipantExcludedDaysConfigDialogComponent, {
        data: {
          dates: participant.participationInfo.excludedDays || []
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

  onExperimentAppSyncClicked(participant: any){
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(flatMap(expService => expService.sendClientFullSyncMessages(participant._id))).subscribe(
        res => {
          this.notificationService.pushSnackBarMessage({
            message: "Request synchronization to " + participant.participationInfo.alias + "'s devices."
          })
        },
        err => {
          console.error(err)
          this.notificationService.pushSnackBarMessage({
            message: "Request failed due to an error."
          })
        }
      )
    )
  }



  getParticipationStatus(participant: any): string {
    if (participant.dropped === true) {
      return 'dropped'
    } else { return 'participating' }
  }

  setSortParticipants(): void {
    this.participantDataSource.sort = this.participantSort;
    this.participantDataSource.sortingDataAccessor = (data: any, sortHeaderId: string) => {
      if (data) {
        switch (sortHeaderId) {
          case "alias": { return data.participationInfo.alias || ''; }
          case "username": { if (data) { return data.username || ''; } break; }
          case "status": {
            if (data.participationInfo.dropped) { return 2; } else { return 1; }
          }
          case "excludedDays":
            if (data.participationInfo.excludedDays) {
              return data.participationInfo.excludedDays.length
            } else { return '' }
          case "rangeStart": { if (data.participationInfo.experimentRange) { return data.participationInfo.experimentRange.from } break; }
          case "joined": { return data.participationInfo.approvedAt || '' }
          case "created": { if (data) { return data.createdAt || ''; } break; }
          case "lastSync": return data["lastSyncTimestamp"] || '';
          case "lastSession": return data["lastSessionTimestamp"] || '';
          case "userId": { if (data) { return data._id || ''; } break; }
          default: { return ''; }
        }
      }
      return '';
    }
  }
}
