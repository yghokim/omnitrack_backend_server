import { Component, Inject } from "@angular/core";
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from "@angular/material";
import { ITrackerDbEntity } from "../../../../../../omnitrack/core/db-entity-types";
import { getTrackerColorString } from "../../omnitrack-helper";

export interface TrackerPickerData {
  trackers: Array<ITrackerDbEntity>
}

@Component({
  selector: 'app-tracker-picker',
  templateUrl: './tracker-picker.component.html',
  styleUrls: ['./tracker-picker.component.scss']
})
export class TrackerPickerComponent {

  trackers: Array<ITrackerDbEntity>

  constructor(private bottomSheetRef: MatBottomSheetRef, @Inject(MAT_BOTTOM_SHEET_DATA) data: TrackerPickerData) {
    this.trackers = data.trackers
  }

  getTrackerColorString(tracker: any): string {
    return getTrackerColorString(tracker)
  }

  onTrackerClicked(tracker: ITrackerDbEntity){
    this.bottomSheetRef.dismiss(tracker)
  }
}