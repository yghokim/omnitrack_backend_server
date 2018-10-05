import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ResearchApiService } from '../services/research-api.service';
import { Subscription } from 'rxjs';
import { tap, flatMap, combineLatest } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';
import { aliasCompareFunc, deepclone } from '../../../shared_lib/utils';
import { IParticipantDbEntity, ITrackerDbEntity, ITriggerDbEntity, getIdPopulateCompat, IAttributeDbEntity } from '../../../omnitrack/core/db-entity-types';
import { TriggerConstants } from '../../../omnitrack/core/trigger-constants';

@Component({
  selector: 'app-experiment-tracking-entity-status',
  templateUrl: './experiment-tracking-entity-status.component.html',
  styleUrls: ['./experiment-tracking-entity-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentTrackingEntityStatusComponent implements OnInit, OnDestroy {

  public readonly editorOptions = {
    theme: 'vs-dark', language: 'json',
    automaticLayout: true,
    wordWrap: 'on',
    readOnly: true,
    minimap: {
      enabled: false
    }
  };

  private readonly _internalSubscriptions = new Subscription()

  private readonly _currentSelectionSubscriptions = new Subscription()

  public participants: Array<IParticipantDbEntity>
  public selectedParticipantId: String

  public participantTrackers: Array<ITrackerDbEntity> = [];
  public participantTriggers: Array<ITriggerDbEntity> = [];

  public selectedEntityType: string //"tracker" | "trigger" | "attribute" | "triggerCondition" | "triggerAction"
  public selectedEntityId: string
  public selectedEntityParentId: string
  public selectedEntityOriginalObj: any
  public selectedEntityCode: string

  public loadingParticipantInfo: boolean = true

  constructor(private api: ResearchApiService, private notificationService: NotificationService, private detector: ChangeDetectorRef) {

  }

  ngOnInit() {
    this.notificationService.registerGlobalBusyTag(
      "participantsInEntityStatusComponent"
    );
    this._internalSubscriptions.add(
      this.api.selectedExperimentService
        .pipe(
          tap(service => {
            service.trackingDataService.registerConsumer(
              "trackingEntityStatus"
            );
          }),
          flatMap(service => service.getParticipants())
        )
        .subscribe(participants => {
          /*
          participants.sort((a,b)=>{return new Date(a.experimentRange.from).getTime() - new Date(b.experimentRange.from).getTime()})*/
          const sortFunc = aliasCompareFunc(false)
          participants.sort((a, b) => sortFunc(a.alias, b.alias))
          this.participants = participants;
          if (this.participants.length > 0) {
            this.onSelectedParticipantIdChanged(this.participants[0]._id);
          }
          this.notificationService.unregisterGlobalBusyTag(
            "participantsInEntityStatusComponent"
          );

          this.detector.markForCheck()
        })
    );
  }

  ngOnDestroy() {
    if (this.api.selectedExperimentServiceSync) {
      this.api.selectedExperimentServiceSync.trackingDataService.unregisterConsumer(
        "trackingEntityStatus"
      );
    }

    this._internalSubscriptions.unsubscribe();
    this._currentSelectionSubscriptions.unsubscribe();
  }

  public onSelectedParticipantIdChanged(participantId: String) {
    this._currentSelectionSubscriptions.unsubscribe();
    this.participantTrackers = null
    this.participantTriggers = null
    this.selectedParticipantId = participantId
    this.loadingParticipantInfo = true
    this.detector.markForCheck()

    const userId = getIdPopulateCompat(this.participants.find(p => p._id === participantId).user, "_id")
    console.log("new user id:", userId)
    if (userId != null) {
      this._currentSelectionSubscriptions.add(
        this.api.selectedExperimentService.pipe(
          flatMap(expService => {
            return expService.trackingDataService.getTrackersOfUser(userId).pipe(combineLatest(
              expService.trackingDataService.getTriggersOfUser(userId)
            ))
          })
        ).subscribe(
          result => {
            this.participantTrackers = result["0"]
            this.participantTriggers = result["1"]
            this.loadingParticipantInfo = false
            this.detector.markForCheck()
          }
        )
      )
    }
  }

  public onElementSelected(parent: any, ev: {type: string, obj: any})
  {

    this.selectedEntityType = ev.type

    const obj = deepclone(ev.obj)
    switch(ev.type){
      case "tracker":
      this.cleanTrackerObj(obj)
      this.selectedEntityId = ev.obj._id
      this.selectedEntityParentId = null
      break;
      case "attribute":
      this.cleanAttributeObj(obj)
      this.selectedEntityId = ev.obj.localId
      this.selectedEntityParentId = parent._id
      break;
      case "trigger":
      this.cleanTriggerObj(obj)
      this.selectedEntityId = ev.obj._id
      this.selectedEntityParentId = null
      break;
    }

    this.selectedEntityOriginalObj = obj

    this.selectedEntityCode = JSON.stringify(this.selectedEntityOriginalObj, null, "\t")
  }

  public getLoggingTriggerList(triggers: Array<ITriggerDbEntity>): Array<ITriggerDbEntity>{
    return triggers!=null? triggers.filter(trigger => trigger.actionType === TriggerConstants.ACTION_TYPE_LOG) : []
  }

  private cleanObjBase(obj: any){
    delete obj.userCreatedAt
    delete obj.userUpdatedAt
    delete obj.updatedAt
    delete obj.createdAt
    delete obj.flags
    delete obj.__v
  }

  private cleanTrackerObj(obj: ITrackerDbEntity){
    this.cleanObjBase(obj)
    delete obj._id
    delete obj.user
    delete obj.removed
    if(obj.attributes != null){
      obj.attributes.forEach(attribute => {
        this.cleanAttributeObj(attribute)
      })
    }
  }

  private cleanAttributeObj(obj: IAttributeDbEntity){
    this.cleanObjBase(obj)
    delete obj.localId
    delete obj.objectId
    delete obj.trackerId
  }

  private cleanTriggerObj(obj: ITriggerDbEntity){
    this.cleanObjBase(obj)
    delete obj._id
    delete obj.user
    delete obj.lastTriggeredTime
    if(obj.actionType === TriggerConstants.ACTION_TYPE_REMIND){
      delete obj.trackers
    }
  }
}
