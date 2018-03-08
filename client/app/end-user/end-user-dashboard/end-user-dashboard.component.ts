import { Component, OnInit, OnDestroy } from "@angular/core";
import { EndUserApiService } from "../services/end-user-api.service";
import { ITrackerDbEntity, IItemDbEntity } from "../../../../omnitrack/core/db-entity-types";
import { Subscription } from "rxjs/Subscription";
import { Observable } from 'rxjs/Observable';
import { TrackingSet } from "../../shared-visualization/custom/productivity-dashboard/productivity-dashboard.component";
import 'rxjs/add/operator/combineLatest';


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
        const productivityTracker = trackers.find(tracker => {
          if (tracker.flags) {
            if (tracker.flags.injectionId === "Ab0ksQyh") {
              return true;
            } else return false;
          } else return false;
        });

        const omitLogTracker = trackers.find(tracker => {
          if (tracker.flags) {
            if (tracker.flags.injectionId === "gGv9WCm3") {
              return true
            } else return false
          } else return false
        })

        if (productivityTracker) {
          this.api.loadItemsofTracker(productivityTracker._id)


          const experimentId = productivityTracker.flags.experiment

          this._internalSubscriptions.add(

            this.api.getItemsOfTracker(productivityTracker._id).combineLatest(
              omitLogTracker ? this.api.getItemsOfTracker(omitLogTracker._id) : Observable.of([]),
              experimentId? this.api.getExperimentParticipationList() : Observable.of([]), 
              (items, logs, experiments) => {
                return [items, logs, experiments]
              }
            )
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
