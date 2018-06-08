import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../../services/research-api.service';
import { ExperimentService } from '../../services/experiment.service';
import { Subscription } from 'rxjs';
import { flatMap } from 'rxjs/operators';

@Component({
  selector: 'app-omnitrack-package-list',
  templateUrl: './omnitrack-package-list.component.html',
  styleUrls: ['./omnitrack-package-list.component.scss']
})
export class OmniTrackPackageListComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()

  private experimentService: ExperimentService
  public packages: Array<any>
  constructor(private api: ResearchApiService) {
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(flatMap(expService => expService.getOmniTrackPackages())).subscribe(packages => {
        this.packages = packages
        console.log(packages)
      })
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  getTrackerColorString(tracker: any): string {
    const colorInt = tracker.color
    if (colorInt) {
      const alpha = (colorInt >> 24) & 0xFF
      const red = (colorInt >> 16) & 0xFF
      const green = (colorInt >> 8) & 0xFF
      const blue = (colorInt) & 0xFF
      return "rgba(" + red + "," + green + "," + blue + "," + (alpha / 255) + ")"
    } else { return "transparent" }
  }

  findTracker(pack, trackerId) {
    return pack.data.trackers.find(tracker => tracker.objectId === trackerId)
  }

  onAddNewPackageClicked() {

  }

}
