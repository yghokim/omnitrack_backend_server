import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { IFieldDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import { TrackingPlanService } from '../../tracking-plan.service';
import { OTConnection, TIMEQUERY_PRESETS, TimeQueryPreset, OTTimeQuery } from '../../../../../../omnitrack/core/value-connection/value-connection';
import { AMeasureFactory } from '../../../../../../omnitrack/core/value-connection/measure-factory';
import { MeasureFactoryManager } from '../../../../../../omnitrack/core/value-connection/measure-factory.manager';
import * as deepEqual from 'deep-equal';
import { deepclone } from '../../../../../../shared_lib/utils';
import { MatDialog } from '@angular/material';
import { Subscription } from 'rxjs';
import { YesNoDialogComponent } from '../../../../dialogs/yes-no-dialog/yes-no-dialog.component';

@Component({
  selector: 'app-connection-detail-panel',
  templateUrl: './connection-detail-panel.component.html',
  styleUrls: ['./connection-detail-panel.component.scss', '../tracking-plan-detail.component.scss'],
  host: { class: 'sidepanel-container' }
})
export class ConnectionDetailPanelComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()

  private _connection: OTConnection

  @Input()
  set connection(newConnection: OTConnection) {

    if (this._connection != newConnection) {
      this._connection = newConnection
      if (newConnection != null && newConnection.measure != null) {
        this._selectedFactory = MeasureFactoryManager.getMeasureFactoryByCode(this._connection.measure.code)
      } else {
        this._selectedFactory = null
      }

      if (newConnection != null && newConnection.query) {
        this.selectedTimeQuery = TIMEQUERY_PRESETS.find(preset => deepEqual(preset.query, newConnection.query))
      } else {
        this._selectedTimeQueryPreset = null
      }

      this.changeDetector.markForCheck()
    }
  }

  get connection(): OTConnection {
    return this._connection
  }

  @Output()
  connectionChange = new EventEmitter<OTConnection>()

  @Input()
  field: IFieldDbEntity

  constructor(private planService: TrackingPlanService, private changeDetector: ChangeDetectorRef, private dialog: MatDialog) {

  }

  ngOnInit(): void {

  }

  ngOnDestroy(){
    this._internalSubscriptions.unsubscribe()
  }

  getAttachableFactories(): Array<AMeasureFactory> {
    return MeasureFactoryManager.getAttachableMeasureFactories(this.field, this.planService.currentPlan)
  }

  getTimeQueryPresets(): Array<TimeQueryPreset> {
    if (this.selectedFactory) {
      return TIMEQUERY_PRESETS.filter(p => p.granularity >= (this.selectedFactory.minimumGranularity || 0))
    } else return null
  }

  getTimeQueryPresetNames(): Array<string> {
    return this.getTimeQueryPresets().map(q => q.name)
  }

  private _selectedFactory: AMeasureFactory
  get selectedFactory(): AMeasureFactory {
    return this._selectedFactory
  }

  set selectedFactory(factory: AMeasureFactory) {
    if (this._selectedFactory !== factory) {
      this._selectedFactory = factory

      if (factory) {
        if (this.selectedTimeQuery == null || this.selectedTimeQuery.granularity < factory.minimumGranularity) {
          this.selectedTimeQuery = TIMEQUERY_PRESETS.filter(p => p.granularity >= (factory.minimumGranularity || 0))[0]
        }
      }

      if (this._connection) {
        if (this._connection.measure) {
          this._connection.measure.code = factory.code
        } else {
          this._connection.measure = {
            code: factory.code,
            args: null
          }
        }
      } else {
        const connection = new OTConnection()
        connection.measure = {
          code: factory.code,
          args: null
        }
        connection.query = deepclone(this.selectedTimeQuery.query)
        this.connection = connection
      }

      this.connectionChange.emit(this.connection)
      this.changeDetector.markForCheck()
    }
  }

  private _selectedTimeQueryPreset: TimeQueryPreset

  get selectedTimeQuery(): TimeQueryPreset {
    return this._selectedTimeQueryPreset
  }

  set selectedTimeQuery(timeQuery: TimeQueryPreset) {
    if (this._selectedTimeQueryPreset !== timeQuery) {
      this._selectedTimeQueryPreset = timeQuery
      if (this._connection) {
        this._connection.query = deepclone(timeQuery.query)
      } else {
        const connection = new OTConnection()
        connection.measure = {
          code: this.selectedFactory.code,
          args: null
        }
        connection.query = deepclone(timeQuery.query)
        this.connection = connection
      }

      this.connectionChange.emit(this.connection)
      this.changeDetector.markForCheck()
    }
  }

  onRemoveConnectionClicked() {
    this._internalSubscriptions.add(
      this.dialog.open(YesNoDialogComponent, {
        data: {
          title: "Remove Connection",
          message: "Do you want to discard this connection settings?"
        }
      }).afterClosed().subscribe(approved => {
        if (approved === true) {
          this.connection = null
          this.connectionChange.emit(this.connection)
        }
      })
    )
  }

}