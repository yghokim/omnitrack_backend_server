import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from "@angular/core";
import { ResearchApiService } from "../services/research-api.service";
import { Subscription } from "rxjs";
import { tap, flatMap, combineLatest } from "rxjs/operators";
import { NotificationService } from "../services/notification.service";
import { aliasCompareFunc, deepclone } from "../../../shared_lib/utils";
import {
  IUserDbEntity,
  ITrackerDbEntity,
  ITriggerDbEntity,
  getIdPopulateCompat,
  IAttributeDbEntity
} from "../../../omnitrack/core/db-entity-types";
import { TriggerConstants } from "../../../omnitrack/core/trigger-constants";
import * as deepEqual from 'deep-equal';
import { MatDialog } from "@angular/material";
import { YesNoDialogComponent } from '../dialogs/yes-no-dialog/yes-no-dialog.component';

import{ ClipboardService } from 'ngx-clipboard'

@Component({
  selector: "app-experiment-tracking-entity-status",
  templateUrl: "./experiment-tracking-entity-status.component.html",
  styleUrls: ["./experiment-tracking-entity-status.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentTrackingEntityStatusComponent
  implements OnInit, OnDestroy {
  public readonly editorOptions = {
    theme: "vs-dark",
    language: "json",
    automaticLayout: true,
    wordWrap: "on",
    minimap: {
      enabled: false
    }
  };

  private readonly _internalSubscriptions = new Subscription();

  private _currentSelectionSubscription: Subscription

  private trackers: Array<ITrackerDbEntity> = [];
  private triggers: Array<ITriggerDbEntity> = [];

  public participants: Array<IUserDbEntity>;
  public selectedParticipantId: String;

  public participantTrackers: Array<ITrackerDbEntity> = [];
  public participantTriggers: Array<ITriggerDbEntity> = [];

  public selectedEntityType: string; //"tracker" | "trigger" | "attribute" | "triggerCondition" | "triggerAction"
  public selectedEntityId: string;
  public selectedEntityParentId: string;
  public selectedEntityOriginalObj: any;
  public selectedEntityCode: string;

  public loadingParticipantInfo: boolean = true;

  constructor(
    private api: ResearchApiService,
    private notificationService: NotificationService,
    private clipboard: ClipboardService,
    private dialog: MatDialog,
    private detector: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.notificationService.registerGlobalBusyTag(
      "participantsInEntityStatusComponent"
    );
    this._internalSubscriptions.add(
      this.api.selectedExperimentService
        .pipe(
          flatMap(service => service.getActiveParticipants())
        )
        .subscribe(participants => {
          /*
          participants.sort((a,b)=>{return new Date(a.experimentRange.from).getTime() - new Date(b.experimentRange.from).getTime()})*/
          const sortFunc = aliasCompareFunc(false);
          participants.sort((a, b) => sortFunc(a.participationInfo.alias, b.participationInfo.alias));
          this.participants = participants;
          if (this.participants.length > 0) {
            this.onSelectedParticipantIdChanged(this.participants[0]._id);
          }
          this.notificationService.unregisterGlobalBusyTag(
            "participantsInEntityStatusComponent"
          );

          this.detector.markForCheck();
        })
    );
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe();
    if(this._currentSelectionSubscription)
      this._currentSelectionSubscription.unsubscribe();
  }

  public onSelectedParticipantIdChanged(participantId: string) {
    if(this._currentSelectionSubscription)
      this._currentSelectionSubscription.unsubscribe();

    this.participantTrackers = null;
    this.participantTriggers = null;
    this.selectedParticipantId = participantId;
    this.loadingParticipantInfo = true;
    this.detector.markForCheck();
    this._currentSelectionSubscription = this.api.selectedExperimentService
    .pipe(
      flatMap(expService => expService.getEntitiesOfUserInExperiment(participantId))
    )
    .subscribe(result => {
      this.participantTrackers = result.trackers;
      this.participantTriggers = result.triggers;
      this.loadingParticipantInfo = false;
      this.detector.markForCheck();
    })
  }

  public onElementSelected(parent: any, ev: { type: string; obj: {obj: any, parentId?: string} }) {
    this.selectedEntityType = ev.type;
    this.selectedEntityParentId = ev.obj.parentId

    const obj = deepclone(ev.obj.obj);
    switch (ev.type) {
      case "tracker":
        this.cleanTrackerObj(obj);
        this.selectedEntityId = ev.obj.obj._id;
        break;
      case "attribute":
        this.cleanAttributeObj(obj);
        this.selectedEntityId = ev.obj.obj.localId;
        break;
      case "trigger":
        this.cleanTriggerObj(obj);
        this.selectedEntityId = ev.obj.obj._id;
        break;
    }

    this.selectedEntityOriginalObj = obj;

    this.onCodeResetClicked();
  }

  public onCopySelectedIdClicked(){
    this.clipboard.copyFromContent(this.selectedEntityId)
    this.notificationService.pushSnackBarMessage({
      message: "Copied the entity id to the clipboard."
    })
  }

  public getLoggingTriggerList(
    triggers: Array<ITriggerDbEntity>
  ): Array<ITriggerDbEntity> {
    return triggers != null
      ? triggers.filter(
          trigger => trigger.actionType === TriggerConstants.ACTION_TYPE_LOG
        )
      : [];
  }

  public trackByLocalId(index, item){
    return item.localId
  }

  public trackById(index, item){
    return item._id
  }

  private cleanObjBase(obj: any) {
    delete obj.userCreatedAt;
    delete obj.userUpdatedAt;
    delete obj.updatedAt;
    delete obj.createdAt;
    delete obj.flags;
    delete obj.__v;
  }

  private cleanTrackerObj(obj: ITrackerDbEntity) {
    this.cleanObjBase(obj);
    delete obj._id;
    delete obj.user;
    delete obj.removed;
    delete obj.attributes;
  }

  private cleanAttributeObj(obj: IAttributeDbEntity) {
    this.cleanObjBase(obj);
    delete obj.localId;
    delete obj._id;
    delete obj.trackerId;
  }

  private cleanTriggerObj(obj: ITriggerDbEntity) {
    this.cleanObjBase(obj);
    delete obj._id;
    delete obj.user;
    delete obj.lastTriggeredTime;
    if (obj.actionType === TriggerConstants.ACTION_TYPE_REMIND) {
      delete obj.trackers;
    }
  }

  public isCodeChanged(): boolean {
    try{
      const parsed = JSON.parse(this.selectedEntityCode)
      return deepEqual(parsed, this.selectedEntityOriginalObj) !== true
    }catch(ex){
      return false
    }
  }

  public isCurrentCodeValid(): boolean {
    try {
      const parsed = JSON.parse(this.selectedEntityCode)
      return true
    } catch (ex) {
      return false
    }
  }

  public onCodeResetClicked() {
    this.selectedEntityCode = JSON.stringify(
      this.selectedEntityOriginalObj,
      null,
      "\t"
    );
  }

  public onApplyChangesClicked() {
    this._internalSubscriptions.add(
      this.dialog.open(YesNoDialogComponent, {
        data: {
          title: "Warning",
          message: "Changes will be applied to the participant's application. Therefore, irrational modification of the raw JSON may cause problems on the participant's app.<br>Do you want to apply the changes?",
          positiveLabel: "Yes, apply the changes",
          negativeLabel: "Cancel"
        }
      }).afterClosed().subscribe(approved=>{
        if(approved === true){
          this.applyCurrentSelectionToServer()
        }
      })
    )
  }

  private handleUpdatedElement(updated: any, keyName: string, list: Array<any>){
    if(updated){
      const matchIndex = list.findIndex(i => i[keyName] === updated[keyName])
      if(matchIndex !== -1){
        list[matchIndex] = updated
      }else{
        list.push(updated)
      }
      this.detector.markForCheck()
    }
  }

  private applyCurrentSelectionToServer(){
    var update: any
    var queryId: string
    switch(this.selectedEntityType){
      case 'triggerAction':
      update = {action: JSON.parse(this.selectedEntityCode)}
      queryId = this.selectedEntityParentId
      break;
      case 'triggerCondition':
      update = {condition: JSON.parse(this.selectedEntityCode)}
      queryId = this.selectedEntityParentId
      break;
      case 'attribute':
      update = JSON.parse(this.selectedEntityCode)
      queryId = this.selectedEntityParentId
      break;
      case 'trigger':
      case 'tracker':
      update = JSON.parse(this.selectedEntityCode)
      queryId = this.selectedEntityId
      break;
    }

    if(update != null){
      switch(this.selectedEntityType){
        case 'trigger':
        case 'triggerAction':
        case 'triggerCondition':
        this._internalSubscriptions.add(
          this.api.selectedExperimentService
            .pipe(
              flatMap(expService => expService.updateTrigger(queryId, update)),
              tap(result => {
                this.handleUpdatedElement(result.updated, "_id", this.participantTriggers)
              })
            ).subscribe(result=>{
              this.selectedEntityOriginalObj = JSON.parse(this.selectedEntityCode)
              this.detector.markForCheck()
            })
          )
        break;
        case 'tracker':
        this._internalSubscriptions.add(
          this.api.selectedExperimentService
            .pipe(
              flatMap(expService => expService.updateTracker(queryId, update)),
              tap(result => {
                this.handleUpdatedElement(result.updated, "_id", this.participantTrackers)
              })
            ).subscribe(
              result=>{
                this.selectedEntityOriginalObj = JSON.parse(this.selectedEntityCode)
              }
            )
        )
        break;
        case 'attribute':
        this._internalSubscriptions.add(
          this.api.selectedExperimentService
            .pipe(
              flatMap(expService => expService.updateAttributeOfTracker(queryId, this.selectedEntityId, update)),
              tap(result => {
                this.handleUpdatedElement(result.updated, "_id", this.participantTrackers)
              })
            ).subscribe(
              result=>{
                this.selectedEntityOriginalObj = JSON.parse(this.selectedEntityCode)
              }
            )
        )
        break;
      }
    }
  }
}
