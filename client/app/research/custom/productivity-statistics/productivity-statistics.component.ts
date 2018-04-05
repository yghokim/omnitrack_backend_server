import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../../../services/research-api.service';
import { Subscription } from 'rxjs/Subscription';
import { TrackingSet, ProductivityHelper, DecodedItem, ProductivityLog } from '../../../shared-visualization/custom/productivity-helper';
import { ITrackerDbEntity, IItemDbEntity, IParticipantDbEntity } from '../../../../../omnitrack/core/db-entity-types';
import 'rxjs/add/operator/combineLatest';
import { groupArrayByVariable } from '../../../../../shared_lib/utils';

@Component({
  selector: 'app-productivity-statistics',
  templateUrl: './productivity-statistics.component.html',
  styleUrls: ['./productivity-statistics.component.scss']
})
export class ProductivityStatisticsComponent implements OnInit, OnDestroy {

  public excludedParticipantIds: Array<string> = []

  private _internalSubscriptions = new Subscription()

  public participantPool: Array<IParticipantDbEntity>
  public selectedParticipants: Array<IParticipantDbEntity>

  public decodedItems: Array<DecodedItem>
  public productivityLogs: Array<ProductivityLog>
  public decodedItemsPerParticipant: Array<{ participant: any, decodedItems: Array<DecodedItem> }>

  public set trackingSets(newSet: Array<TrackingSet>) {
    this.decodedItems = []
    this.productivityLogs = []
    newSet.forEach(trackingSet => {
      const processed = ProductivityHelper.processTrackingSet(trackingSet)
      this.decodedItems = this.decodedItems.concat(processed.decodedItems)
      this.productivityLogs = this.productivityLogs.concat(processed.productivityLogs)

      if (this.participantPool) {
        this.updateGroupedDecodedItems(this.participantPool, this.decodedItems)
      }
    })
  }

  public trackerPool: Array<ITrackerDbEntity>
  public itemPool: Array<IItemDbEntity>

  constructor(private api: ResearchApiService) {

    if(localStorage.getItem("excludedParticipantIds")){
      this.excludedParticipantIds = JSON.parse(localStorage.getItem("excludedParticipantIds"))
    }

    this._internalSubscriptions.add(
      this.api.selectedExperimentService.flatMap(expService => expService.getParticipants()).subscribe(
        participants => {
          this.participantPool = participants
          this.selectedParticipants = participants.filter(p=> this.excludedParticipantIds.indexOf(p._id) === -1)
          this.onParticipantListChanged(this.selectedParticipants)
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
    if (this.api.selectedExperimentServiceSync) {
      this.api.selectedExperimentServiceSync.trackingDataService.unregisterConsumer("ExperimentCustomStatisticsComponent")
    }

    localStorage.setItem("excludedParticipantIds", JSON.stringify(this.excludedParticipantIds))
  }

  private updateGroupedDecodedItems(participants: Array<any>, decodedItems: Array<DecodedItem>) {
    const grouped = groupArrayByVariable(decodedItems, "user")
    const arrayed = []
    for (let userId of Object.keys(grouped)) {
      const participant = participants.find(p => p.user._id === userId)
      if (participant) {
        arrayed.push({
          participant: participant,
          decodedItems: grouped[userId]
        })
      }
    }
    this.decodedItemsPerParticipant = arrayed
  }

  private onParticipantListChanged(participants: Array<any>) {
    if (this.decodedItems) {
      this.updateGroupedDecodedItems(participants, this.decodedItems)
    }
  }

  public onExcludedParticipantSelectionChanged($event){
    this.selectedParticipants = this.participantPool.filter(p=> this.excludedParticipantIds.indexOf(p._id) === -1)
    this.onParticipantListChanged(this.selectedParticipants)
  }


}
