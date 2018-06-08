import { Component, OnInit, OnDestroy } from "@angular/core";
import { EndUserApiService } from "../services/end-user-api.service";
import { ITrackerDbEntity, IItemDbEntity } from "../../../../omnitrack/core/db-entity-types";
import { Subscription ,  Observable, of } from "rxjs";
import { combineLatest } from 'rxjs/operators';
import { TrackingSet, ProductivityHelper } from "../../shared-visualization/custom/productivity-helper";



@Component({
  selector: "app-end-user-dashboard",
  templateUrl: "./end-user-dashboard.component.html",
  styleUrls: ["./end-user-dashboard.component.scss"]
})
export class EndUserDashboardComponent implements OnInit, OnDestroy {
  private readonly _internalSubscriptions = new Subscription();
  productivityTrackingSet: TrackingSet

  constructor(private api: EndUserApiService) {
    api.loadTrackers();
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.trackers.subscribe(trackers => {
        const productivityTracker = trackers.find(tracker => ProductivityHelper.isProductivityTracker(tracker)===true);

        const omitLogTracker = trackers.find(tracker => ProductivityHelper.isOmitLogTracker(tracker)===true)

        if (productivityTracker) {
          this.api.loadItemsofTracker(productivityTracker._id)


          const experimentId = productivityTracker.flags.experiment

          this._internalSubscriptions.add(

            this.api.getItemsOfTracker(productivityTracker._id).pipe(combineLatest(
              omitLogTracker ? this.api.getItemsOfTracker(omitLogTracker._id) : of([]),
              experimentId? this.api.getExperimentParticipationList() : of([]), 
              (items, logs, experiments) => {
                return [items, logs, experiments]
              }
            ))
              .subscribe(result => {
                const participantList = result[2]
                const thisExperiment = participantList.find(participant => participant._id === experimentId)
                this.productivityTrackingSet = { tracker: productivityTracker, items: result[0],
                  omitLogTracker: omitLogTracker, omitLogs: result[1], overrideStartDate: thisExperiment? thisExperiment.experimentRangeStart : null } as TrackingSet
              })
          )
        }
      })
    );
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe();
  }
}
