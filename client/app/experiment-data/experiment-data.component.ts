import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from "@angular/core";
import { Subscription } from "rxjs/Subscription";
import { ResearchApiService } from "../services/research-api.service";
import { NotificationService } from "../services/notification.service";
import {
  ITrackerDbEntity,
  IItemDbEntity,
  IAttributeDbEntity
} from "../../../omnitrack/core/db-entity-types";
import TypedStringSerializer from "../../../omnitrack/core/typed_string_serializer";
import AttributeManager from "../../../omnitrack/core/attributes/attribute.manager";
import { MatTableDataSource, MatSort, MatPaginator } from '@angular/material';

import { Element } from "@angular/compiler";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import attributeTypes from "../../../omnitrack/core/attributes/attribute-types";
import { Response } from "@angular/http";
import { Observable } from "rxjs/Observable";

@Component({
  selector: "app-experiment-data",
  templateUrl: "./experiment-data.component.html",
  styleUrls: ["./experiment-data.component.scss"]
})
export class ExperimentDataComponent implements OnInit, OnDestroy {
  private readonly _internalSubscriptions = new Subscription();

  private userSubscriptions = new Subscription();
  private trackerSubscriptions = new Subscription();

  public participants: Array<any> = [];

  public selectedParticipantId: string;
  public selectedTracker: ITrackerDbEntity;

  public selectedTrackerIndex: number = 0;

  public userTrackers: Array<ITrackerDbEntity> = [];

  public trackerDataSource: MatTableDataSource<IItemDbEntity>;

  public trackerItems: Array<IItemDbEntity> = [];

  @ViewChild(MatSort) sort: MatSort;

  public screenExpanded: boolean = false

  private tableSchema: Array<{
    localId: string;
    name: string;
    type: number;
    hide: boolean;
  }> = [];

  constructor(
    private api: ResearchApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.notificationService.registerGlobalBusyTag(
      "participantsInDataComponent"
    );
    this._internalSubscriptions.add(
      this.api.selectedExperimentService
        .do(service => {
          service.trackingDataService.registerConsumer(
            "experimentDataComponent"
          );
        })
        .flatMap(service => service.getParticipants())
        .subscribe(participants => {
          participants.sort((a,b)=>{return new Date(a.experimentRange.from).getTime() - new Date(b.experimentRange.from).getTime()})
          this.participants = participants;
          if (this.participants.length > 0) {
            this.selectedParticipantId = this.participants[0]._id;
            this.onSelectedParticipantIdChanged(this.selectedParticipantId);
          }
          this.notificationService.unregisterGlobalBusyTag(
            "participantsInDataComponent"
          );
        })
    );
  }

  ngOnDestroy(): void {
    if (this.api.selectedExperimentServiceSync) {
      this.api.selectedExperimentServiceSync.trackingDataService.unregisterConsumer(
        "experimentDataComponent"
      );
    }
    this._internalSubscriptions.unsubscribe();
    this.userSubscriptions.unsubscribe();
  }

  onExpandButtonClicked(){
    this.screenExpanded = !this.screenExpanded
  }

  onParticipantSelectionChanged(event) {
    this.onSelectedParticipantIdChanged(this.selectedParticipantId)
  }


  onTrackerTabChanged(event) {
    this.onSelectedTrackerChanged(this.userTrackers[event.index]);
  }

  private onSelectedParticipantIdChanged(newParticipantId: string) {
    const userId = this.participants.find(p => p._id == newParticipantId).user
      ._id;
    this.userSubscriptions.unsubscribe();
    this.userSubscriptions = new Subscription();
    this.userSubscriptions.add(
      this.api.selectedExperimentService
        .flatMap(service =>
          service.trackingDataService.getTrackersOfUser(userId)
        )
        .subscribe(trackers => {
          this.userTrackers = trackers;
          const selectedTrackerIndex = Math.max(
            0,
            Math.min(trackers.length - 1, this.selectedTrackerIndex)
          );
          this.onSelectedTrackerChanged(this.userTrackers[selectedTrackerIndex]);
        })
    );
  }

  private onSelectedTrackerChanged(tracker: ITrackerDbEntity) {
    if (this.selectedTracker != tracker) {
      this.selectedTracker = tracker;

      this.trackerSubscriptions.unsubscribe();
      this.trackerSubscriptions = new Subscription();
      this.trackerSubscriptions.add(
        this.api.selectedExperimentService
          .flatMap(service =>
            service.trackingDataService.getItemsOfTracker(tracker._id)
          )
          .subscribe(items => {
            this.trackerItems = items;
            this.trackerDataSource = new MatTableDataSource(items)
            this.trackerDataSource.sortingDataAccessor = (data: IItemDbEntity, sortHeaderId: string) => {
              if(sortHeaderId === 'timestamp'){ return data.timestamp || '';}
              for (let item of data.dataTable){
                if(item.attrLocalId === sortHeaderId){
                  return item.sVal || '';
                }
              }
              return '';
            }
            this.trackerDataSource.sort = this.sort;
          })
      );
    }
  }

  isImageAttribute(attr: IAttributeDbEntity):boolean{
    return attr.type === attributeTypes.ATTR_TYPE_IMAGE
  }

  getItemValue(item: IItemDbEntity, attr: IAttributeDbEntity, tryFormatted: boolean): any {
    const tableEntry = item.dataTable.find(
      entry => entry.attrLocalId === attr.localId
    );
    if (tableEntry && tableEntry.sVal != null) {
      const helper = AttributeManager.getHelper(attr.type);
      const deserializedValue = TypedStringSerializer.deserialize(
        tableEntry.sVal
      );
      if (helper && tryFormatted === true) {
        const formatted = helper.formatAttributeValue(attr, deserializedValue);
        return formatted;
      } else return deserializedValue;
    } else return null;
  }

  getTrackerColumns(tracker: ITrackerDbEntity): any[]{
    const temp = tracker.attributes.map((attribute)=>{return attribute.localId})
    return temp.concat('timestamp')
  }    
}
