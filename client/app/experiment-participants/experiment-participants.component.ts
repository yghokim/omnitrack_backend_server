import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { Subscription, empty, Observable, zip, of } from 'rxjs';
import { flatMap, tap, catchError, map } from 'rxjs/operators';
import { MatDialog, MatTableDataSource, MatSort, MatBottomSheet } from '@angular/material';
import { YesNoDialogComponent } from '../dialogs/yes-no-dialog/yes-no-dialog.component';
import { TextInputDialogComponent } from '../dialogs/text-input-dialog/text-input-dialog.component';
import { NotificationService } from '../services/notification.service';
import { IUserDbEntity } from '../../../omnitrack/core/db-entity-types';
import { ParticipantExcludedDaysConfigDialogComponent } from '../dialogs/participant-excluded-days-config-dialog/participant-excluded-days-config-dialog.component';
import { IExperimentDbEntity } from '../../../omnitrack/core/research/db-entity-types';
import { CreateUserAccountDialogComponent, CreateUserAccountDialogData } from './create-user-account-dialog/create-user-account-dialog.component';
import { TextClipboardPastedBottomSheetComponent } from '../components/text-clipboard-pasted-bottom-sheet/text-clipboard-pasted-bottom-sheet.component';
import { generateRowTriggerAnimation } from '../research/omnitrack/omnitrack-helper';


@Component({
  selector: 'app-experiment-participants',
  templateUrl: './experiment-participants.component.html',
  styleUrls: ['./experiment-participants.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [generateRowTriggerAnimation()]
})
export class ExperimentParticipantsComponent implements OnInit, OnDestroy {

  public participantColumns: Array<string>

  private experiment: IExperimentDbEntity
  public participants: Array<IUserDbEntity>
  public isLoadingParticipants = true
  public isLoadingSessionSummary = true

  public hoveredRowIndex = -1
  public hoveredParticipantId = null

  public screenExpanded = true

  public participantDataSource: MatTableDataSource<IUserDbEntity>;
  @ViewChild(MatSort) participantSort: MatSort;

  private readonly _internalSubscriptions = new Subscription()

  constructor(
    public api: ResearchApiService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private detector: ChangeDetectorRef,
    private bottomSheet: MatBottomSheet
  ) { }

  ngOnInit() {
    this.isLoadingParticipants = true
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(flatMap(expService => expService.getExperiment().pipe(
        map(experiment => ({ expService: expService, experiment: experiment })),
        tap(result => { this.experiment = result.experiment }),
        flatMap(result => result.expService.getParticipants().pipe(map(participants => ({ expService: result.expService, participants: participants })))),
        tap(result => {
          this.participants = result.participants
          this.isLoadingParticipants = false
          this.participantDataSource = new MatTableDataSource(result.participants)

          this.participantColumns = ['alias', 'username', 'group'].concat(
            this.getDemographicKeys()
          ).concat(['status', 'rangeStart', 'excludedDays', 'joined', 'lastSync', 'lastSession', 'userId', 'button'])


          this.setSortParticipants();
          this.detector.markForCheck()
        }),
        flatMap(result => result.expService.updateLatestTimestampsOfParticipants()))
      )).subscribe(result => {
        this.isLoadingSessionSummary = false
          this.detector.markForCheck()
      })
    )
  }

  onReloadClicked() {
    this.isLoadingParticipants = true
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.subscribe(expService => {
        expService.loadParticipantList()
        this.isLoadingParticipants = false
      })
    )
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

  readGroupName(participant: IUserDbEntity): Observable<string> {
    return this.api.selectedExperimentService.pipe(
      flatMap(expService => expService.getExperiment()),
      map(experiment => {
        const group = experiment.groups.find(g => g._id === participant.participationInfo.groupId)
        if (group) {
          return group.name
        } else {
          return null
        }
      })
    )
  }

  getDemographicKeys(): Array<string> {
    if (this.experiment.demographicFormSchema) {
      if (this.experiment.demographicFormSchema.form) {
        return this.experiment.demographicFormSchema.form.map(f => f.key)
      } else return []
    } else return []
  }

  getDemographicSchemaTitle(key: string): string {
    if (this.experiment.demographicFormSchema) {
      if (this.experiment.demographicFormSchema.schema) {
        const schemaUnit = this.experiment.demographicFormSchema.schema[key]
        if (schemaUnit) {
          return schemaUnit.title
        } else return null
      } else return null
    } else return null
  }

  getParticipantDemographicAnswer(participant: IUserDbEntity, key: string): any {
    if (participant.participationInfo.demographic) {
      return participant.participationInfo.demographic[key]
    }
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
          prefill: participant.participationInfo.alias,
          placeholder: "Insert new alias",
          validator: (text) => {
            return (text || "").length > 0 && text.trim() !== participant.participationInfo.alias
          },
          submit: (text) => this.api.selectedExperimentService.pipe(flatMap(service => service.changeParticipantAlias(participant._id, text.trim())), catchError(err => {
            switch (err.error) {
              case "AliasAlreadyExists": throw { error: "The same alias already exists." }
              default: throw err.error
            }
          }))
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

  onExperimentAppSyncClicked(participant: any) {
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

  onGeneratePasswordResetLinkClicked(participantId: string){
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(
        flatMap(expService => expService.generateParticipantPasswordResetLink(participantId))
      ).subscribe(link => {
        this.bottomSheet.open(TextClipboardPastedBottomSheetComponent, {data: {
          message: "Send this URL to the participant.",
          content: link
        }, panelClass: "bottom-sheet-mid-width"})
      })
    )
  }

  getParticipationStatus(participant: any): string {
    if (participant.participationInfo.dropped === true) {
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
          case 'group': {
            if (data.participationInfo) {
              return data.participationInfo.groupId
            } else return ''
          }
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
          default: {
            return this.getParticipantDemographicAnswer(data, sortHeaderId)
          }
        }
      }
      return '';
    }
  }

  onCreateNewUserClicked() {
    this._internalSubscriptions.add(
      this.dialog.open(CreateUserAccountDialogComponent, {
        data: {
          experiment: this.experiment,
          participants: this.participants,
          api: this.api
        } as CreateUserAccountDialogData
      }).afterClosed().subscribe(
        result => {
          if (result != null) {
            this.notificationService.pushSnackBarMessage({
              message: "Created a new user account."
            })
          }
        },
        err => {
          console.log(err)
        }
      ))
  }
}
