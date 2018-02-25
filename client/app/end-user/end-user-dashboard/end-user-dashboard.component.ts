import { Component, OnInit, OnDestroy } from "@angular/core";
import { EndUserApiService } from "../services/end-user-api.service";
import { ITrackerDbEntity, IItemDbEntity } from "../../../../omnitrack/core/db-entity-types";
import { Subscription } from "rxjs/Subscription";
import { TrackingSet } from "../../shared-visualization/custom/productivity-timeline/productivity-timeline.component";

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

        if(productivityTracker){
          this.api.loadItemsofTracker(productivityTracker._id)
            
          this._internalSubscriptions.add(
            this.api.getItemsOfTracker(productivityTracker._id).subscribe(
              items=>{
                console.log(items)
                this.productivityTrackingSet = {tracker: productivityTracker, items: items}
              }
            )
          )
        }
      })
    );
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe();
  }
}
