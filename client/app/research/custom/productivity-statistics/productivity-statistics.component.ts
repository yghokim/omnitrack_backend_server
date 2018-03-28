import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../../../services/research-api.service';
import { Subscription } from 'rxjs/Subscription';
import { TrackingSet, ProductivityHelper, DecodedItem, ProductivityLog } from '../../../shared-visualization/custom/productivity-helper';
import { ITrackerDbEntity, IItemDbEntity } from '../../../../../omnitrack/core/db-entity-types';
import 'rxjs/add/operator/combineLatest';

@Component({
  selector: 'app-productivity-statistics',
  templateUrl: './productivity-statistics.component.html',
  styleUrls: ['./productivity-statistics.component.scss']
})
export class ProductivityStatisticsComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()

  public participantPool: Array<any>

  public decodedItems: Array<DecodedItem>
  public productivityLogs: Array<ProductivityLog>

  public set trackingSets(newSet: Array<TrackingSet>) {
    this.decodedItems = []
    this.productivityLogs = []
    newSet.forEach(trackingSet => {
      const processed = ProductivityHelper.processTrackingSet(trackingSet)
      this.decodedItems = this.decodedItems.concat(processed.decodedItems)
      this.productivityLogs = this.productivityLogs.concat(processed.productivityLogs)
    })
  }

  public trackerPool: Array<ITrackerDbEntity>
  public itemPool: Array<IItemDbEntity>

  constructor(private api: ResearchApiService) {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.flatMap(expService => expService.getParticipants()).subscribe(
        participants => {
          this.participantPool = participants
          this.onParticipantListChanged()
        }
      )
    )

    this._internalSubscriptions.add(
      this.api.selectedExperimentService.flatMap(expService => {
        return expService.trackingDataService.trackers.combineLatest(
          expService.trackingDataService.items, (trackers, items) => {
            return { trackers: trackers, items: items }
          }
        )
      }).subscribe(
        set => {
          this.trackingSets = set.trackers.filter(tracker => ProductivityHelper.isProductivityTracker(tracker) === true).map(
            tracker => {
              const omitLogTracker = set.trackers.find(t => t.user === tracker.user && ProductivityHelper.isOmitLogTracker(t) === true)

              return { tracker: tracker, items: set.items.filter(item => item.tracker === tracker._id), omitLogTracker: omitLogTracker, omitLogs: omitLogTracker ? set.items.filter(i => i.tracker === omitLogTracker._id) : [] }
            }
          )
        }
      )
    )
  }

  ngOnInit() {
    this.api.selectedExperimentService.subscribe(service => {
      service.trackingDataService.registerConsumer("ExperimentCustomStatisticsComponent")
    }
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
    if(this.api.selectedExperimentServiceSync){
      this.api.selectedExperimentServiceSync.trackingDataService.unregisterConsumer("ExperimentCustomStatisticsComponent")
    }
  }

  private onParticipantListChanged() {

  }


}
