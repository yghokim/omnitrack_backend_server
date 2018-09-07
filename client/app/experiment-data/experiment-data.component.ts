import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { Subscription, Observable } from "rxjs";
import { ResearchApiService } from "../services/research-api.service";
import { NotificationService } from "../services/notification.service";
import {
  ITrackerDbEntity,
  IItemDbEntity,
  IAttributeDbEntity,
  IParticipantDbEntity
} from "../../../omnitrack/core/db-entity-types";
import TypedStringSerializer from "../../../omnitrack/core/typed_string_serializer";
import AttributeManager from "../../../omnitrack/core/attributes/attribute.manager";
import { MatTableDataSource, MatSort, MatPaginator, MatDialog } from '@angular/material';

import { Element } from "@angular/compiler";
import attributeTypes from "../../../omnitrack/core/attributes/attribute-types";
import { Response } from "@angular/http";
import { SingletonAudioPlayerServiceService } from "../services/singleton-audio-player-service.service";
import { aliasCompareFunc } from "../../../shared_lib/utils";
import * as moment from 'moment-timezone';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import * as JSZip from 'jszip';
import { UpdateItemCellValueDialogComponent } from "../dialogs/update-item-cell-value-dialog/update-item-cell-value-dialog.component";
import { TextInputDialogComponent } from "../dialogs/text-input-dialog/text-input-dialog.component";
import { TimePoint } from "../../../omnitrack/core/datatypes/field_datatypes";
import { zip } from 'rxjs';
import { tap, flatMap, map } from 'rxjs/operators';

@Component({
  selector: "app-experiment-data",
  templateUrl: "./experiment-data.component.html",
  styleUrls: ["./experiment-data.component.scss"],
  providers: [SingletonAudioPlayerServiceService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentDataComponent implements OnInit, OnDestroy {
  private readonly _internalSubscriptions = new Subscription();

  public printFriendlyMode = false

  private userSubscriptions = new Subscription();
  private trackerSubscriptions = new Subscription();

  public participants: Array<IParticipantDbEntity>;

  public selectedParticipantId: string;
  public selectedTracker: ITrackerDbEntity;

  public selectedTrackerIndex = 0;

  public userTrackers: Array<ITrackerDbEntity> = [];

  public trackerDataSource: MatTableDataSource<IItemDbEntity>;

  public trackerItems: Array<IItemDbEntity> = [];

  @ViewChild(MatSort) sort: MatSort;

  public screenExpanded = true

  private tableSchema: Array<{
    localId: string;
    name: string;
    type: number;
    hide: boolean;
  }> = [];

  constructor(
    private api: ResearchApiService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private detector: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.notificationService.registerGlobalBusyTag(
      "participantsInDataComponent"
    );
    this._internalSubscriptions.add(
      this.api.selectedExperimentService
        .pipe(tap(service => {
          service.trackingDataService.registerConsumer(
            "experimentDataComponent"
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
            this.selectedParticipantId = this.participants[0]._id;
            this.onSelectedParticipantIdChanged(this.selectedParticipantId);
          }
          this.notificationService.unregisterGlobalBusyTag(
            "participantsInDataComponent"
          );

          this.detector.markForCheck()
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

  onExpandButtonClicked() {
    this.screenExpanded = !this.screenExpanded
  }

  onParticipantSelectionChanged(event) {
    this.onSelectedParticipantIdChanged(this.selectedParticipantId)
  }


  onTrackerTabChanged(event) {
    this.onSelectedTrackerChanged(this.userTrackers[event.index]);
  }

  private onSelectedParticipantIdChanged(newParticipantId: string) {
    const userId = this.participants.find(p => p._id === newParticipantId).user
      ._id;
    this.userSubscriptions.unsubscribe();
    this.userSubscriptions = new Subscription();
    this.userSubscriptions.add(
      this.api.selectedExperimentService
        .pipe(flatMap(service =>
          service.trackingDataService.getTrackersOfUser(userId)
        ))
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
    if (this.selectedTracker !== tracker) {
      this.selectedTracker = tracker;

      this.trackerSubscriptions.unsubscribe();
      this.trackerSubscriptions = new Subscription();
      if (tracker != null) {
        this.trackerSubscriptions.add(
          this.api.selectedExperimentService.pipe(
            flatMap(service =>
              service.trackingDataService.getItemsOfTracker(tracker._id)
            ))
            .subscribe(items => {
              this.trackerItems = items;
              this.trackerDataSource = new MatTableDataSource(items)
              this.trackerDataSource.sortingDataAccessor = (data: IItemDbEntity, sortHeaderId: string) => {
                if (sortHeaderId === 'timestamp') { return data.timestamp || ''; }
                for (const item of data.dataTable) {
                  if (item.attrLocalId === sortHeaderId) {
                    return item.sVal || '';
                  }
                }
                return '';
              }
              this.trackerDataSource.sort = this.sort;

              this.detector.markForCheck()
            })
        );
      }
    }
  }

  getItemCountOfTracker(trackerId: string): Observable<number> {
    return this.api.selectedExperimentService.pipe(
      flatMap(service =>
        service.trackingDataService.getItemsOfTracker(trackerId)),
      map(items => items.length)
    )
  }

  isImageAttribute(attr: IAttributeDbEntity): boolean {
    return attr.type === attributeTypes.ATTR_TYPE_IMAGE
  }

  isAudioAttribute(attr: IAttributeDbEntity): boolean {
    return attr.type === attributeTypes.ATTR_TYPE_AUDIO
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
      } else { return deserializedValue; }
    } else { return null; }
  }

  getTimestampValue(item: IItemDbEntity) {
    const stamp: TimePoint = new TimePoint(item.timestamp, item.timezone)
    return stamp.toMoment().format("kk:mm (MMM DD YYYY)") + " " + moment().tz(stamp.timezone).format("z")
  }

  getTrackerColumns(tracker: ITrackerDbEntity): any[] {
    const temp = tracker.attributes.map((attribute) => attribute.localId)
    return temp.concat('timestamp')
  }

  onCellValueClicked(tracker: ITrackerDbEntity, attribute: IAttributeDbEntity, item: IItemDbEntity) {
    this._internalSubscriptions.add(
      this.dialog.open(UpdateItemCellValueDialogComponent, { data: { info: { tracker: tracker, attribute: attribute, item: item } } }).afterClosed().subscribe(
        result => {
          if (result && result.value) {
            this._internalSubscriptions.add(
              this.api.selectedExperimentService.pipe(flatMap(expService => expService.trackingDataService.setItemColumnValue(attribute, item, result.value))).subscribe(
                updateResult => {
                }
              )
            )
          }
        }
      )
    )
  }

  onTimestampClicked(tracker: ITrackerDbEntity, item: IItemDbEntity) {
    const attribute: IAttributeDbEntity = { name: "Logged At", type: 1 };
    this._internalSubscriptions.add(
      this.dialog.open(UpdateItemCellValueDialogComponent, { data: { info: { tracker: tracker, attribute: attribute, item: item } } }).afterClosed().subscribe(
        result => {
          if (result && result.value) {
            this._internalSubscriptions.add(
              this.api.selectedExperimentService.pipe(flatMap(expService => expService.trackingDataService.setItemTimestamp(item, TypedStringSerializer.deserialize(result.value).toDate().getTime(), TypedStringSerializer.deserialize(result.value).timezone))).subscribe(
                updateResult => {
                }
              )
            )
          }
        }
      )
    )

  }

  onExportClicked() {
    this.notificationService.pushSnackBarMessage({ message: "Start packing captured items.." })
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(
        flatMap(service => service.getOmniTrackPackages().pipe(
          flatMap(packages =>
            zip(
              service.trackingDataService.trackers,
              service.trackingDataService.items,
              (trackers, items) => ({ packages: packages, trackers: trackers, items: items })
            )
          )
        )),
        map(result => {
          const commonColumns = ["participant_alias"]
          const packageFiles = result.packages.map(
            pack => {
              const workbook = XLSX.utils.book_new()
              pack.data.trackers.forEach(
                trackerScheme => {
                  console.log(trackerScheme)
                  const injectedAttrNames = trackerScheme.attributes.map(attr => attr.name)
                  const itemRows: Array<Array<any>> = [
                    commonColumns.concat(injectedAttrNames).concat("logged at")
                  ]
                  const trackers = result.trackers.filter(t => (t.flags || {}).injectionId === trackerScheme.flags.injectionId && this.participants.find(p => p.user._id === t.user))
                  trackers.forEach(
                    tracker => {
                      const participant = this.participants.find(p => p.user._id === tracker.user)
                      result.items.filter(i => i.tracker === tracker._id).forEach(
                        item => {
                          const values = trackerScheme.attributes.map(attrScheme => {
                            const attr = tracker.attributes.find(a => (a.flags || {}).injectionId === attrScheme.flags.injectionId)
                            return this.getItemValue(item, attr, true)
                          })

                          itemRows.push([participant.alias].concat(values).concat(moment(item.timestamp).format()))
                        }
                      )
                    }
                  )

                  const sheet = XLSX.utils.aoa_to_sheet(itemRows)
                  XLSX.utils.book_append_sheet(workbook, sheet, trackerScheme.name)
                }
              )
              // save worksheet
              const workbookOut = XLSX.write(workbook, {
                bookType: 'xlsx', bookSST: false, type: 'array'
              })
              return {
                blob: new Blob([workbookOut], { type: "application/octet-stream" }),
                name: this.api.getSelectedExperimentId() + "_experiment-tracking-data_" + pack.name + ".xlsx"
              }
            })

          //extract custom trackers of each participant
          const participantCustomTrackerFiles = []
          this.participants.forEach(
            participant => {
              const trackers = result.trackers.filter(t => (t.flags || {}).experiment === this.api.getSelectedExperimentId() && participant.user._id === t.user)
              if (trackers.length > 0) {
                const workbook = XLSX.utils.book_new()

                trackers.forEach(tracker => {
                  const itemRows: Array<Array<any>> = [
                    commonColumns.concat(tracker.attributes.map(attr => attr.name)).concat("logged at")
                  ]
                  result.items.filter(i => i.tracker === tracker._id).forEach(
                    item => {
                      const values = tracker.attributes.map(attr => {
                        return this.getItemValue(item, attr, true)
                      })
                      itemRows.push([participant.alias].concat(values).concat(moment(item.timestamp).format()))
                    }
                  )
                  const sheet = XLSX.utils.aoa_to_sheet(itemRows)
                  XLSX.utils.book_append_sheet(workbook, sheet, tracker.name)
                })
                // save worksheet
                const workbookOut = XLSX.write(workbook, {
                  bookType: 'xlsx', bookSST: false, type: 'array'
                })

                participantCustomTrackerFiles.push(
                  {
                    blob: new Blob([workbookOut], { type: "application/octet-stream" }),
                    name: this.api.getSelectedExperimentId() + "_experiment-tracking-data-custom_" + participant.alias + ".xlsx"
                  }
                )
              }
            }
          )

          return packageFiles.concat(participantCustomTrackerFiles)
        })
      ).subscribe(
        blobInfos => {
          console.log(blobInfos)
          if (blobInfos.length === 0) {
            this.notificationService.pushSnackBarMessage({ message: "No tracking items." })
          }
          else if (blobInfos.length === 1) {
            FileSaver.saveAs(blobInfos[0].blob, blobInfos[0].name)
          }
          else {
            const jsZip = new JSZip()
            blobInfos.forEach(b => {
              jsZip.file(b.name, b.blob)
            })
            jsZip.generateAsync({ type: 'blob' })
              .then(zipFile => {
                FileSaver.saveAs(zipFile, this.api.getSelectedExperimentId() + "_experiment-tracking-data.zip")
              })
          }
        }
      ))
  }
}
