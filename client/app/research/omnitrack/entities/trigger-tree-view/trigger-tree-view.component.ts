import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { ITriggerDbEntity, ITrackerDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import { TriggerConstants } from '../../../../../../omnitrack/core/trigger/trigger-constants';
import * as moment from 'moment-timezone';
import { MatDialog } from '@angular/material';
import { ResearchApiService } from '../../../../services/research-api.service';
import { Subscription } from 'rxjs';
import { filter, flatMap } from 'rxjs/operators';
import { YesNoDialogComponent } from '../../../../dialogs/yes-no-dialog/yes-no-dialog.component';
import { NotificationService } from '../../../../services/notification.service';
import { makeShortenConditionString } from '../../omnitrack-helper';

@Component({
  selector: 'app-trigger-tree-view',
  templateUrl: './trigger-tree-view.component.html',
  styleUrls: ['./trigger-tree-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class TriggerTreeViewComponent implements OnInit, OnDestroy {

  @Input() isReminder: boolean = false
  @Input() oppendCascadingLevel: number = 0
  @Input() trigger: ITriggerDbEntity
  @Input() trackers: Array<ITrackerDbEntity>
  @Output() treeItemClick = new EventEmitter<{ type: string, obj: any }>()

  private readonly _internalSubscriptions = new Subscription()

  constructor(private api: ResearchApiService, private dialog: MatDialog, private notificationService: NotificationService) { }

  ngOnInit() {
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  public onElementClicked(ev: { type: string, obj: any }) {
    this.treeItemClick.emit(ev)
  }

  public getType(): string {
    switch (this.trigger.actionType) {
      case TriggerConstants.ACTION_TYPE_LOG:
        return "Trigger"
      case TriggerConstants.ACTION_TYPE_REMIND:
        return "Reminder"
    }
  }

  public makeShortenConditionString(): string {
    return makeShortenConditionString(this.trigger)
  }

  public onSendTestPingClicked() {
    this._internalSubscriptions.add(
      this.dialog.open(YesNoDialogComponent, {
        data: {
          title: "Send a Test Ping",
          message: "Do you want to fire this " + (this.isReminder === true ? 'reminder' : 'trigger') + " immediately?",
          positiveLabel: "Send",
          negativeLabel: "Cancel"
        }
      }).afterClosed().pipe(
        filter(confirmed => confirmed === true),
        flatMap(() => this.api.selectedExperimentService),
        flatMap(expService => expService.sendTestPingOfTrigger(this.trigger._id))
      ).subscribe(
        pingSent => {
          this.notificationService.pushSnackBarMessage({ message: "A test ping will be sent to the participant's apps shortly." })
        },
        ex => {
          console.error(ex)
        }
      )
    )
  }
}
