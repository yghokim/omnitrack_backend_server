import { Component, OnInit, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { deepclone } from '../../../../../../../shared_lib/utils';
import * as deepEqual from 'deep-equal';
import { FunctionFlag, DependencyLevel, OmniTrackFlagGraph } from '../../../../../../../omnitrack/core/functionality-locks/omnitrack-dependency-graph';
import { TrackingPlanService } from '../../../tracking-plan.service';
import { FUNCTION_FLAG_LABEL_HELPER, FLAG_VISIBILITY_DICT } from '../../../function-flag-label-helper';

export interface ConfigurationSheetData {
  level: DependencyLevel,
  model: any,
  trackingPlanManager: TrackingPlanService
}

@Component({
  selector: 'app-lock-configuration-sheet',
  templateUrl: './lock-configuration-sheet.component.html',
  styleUrls: ['./lock-configuration-sheet.component.scss']
})
export class LockConfigurationSheetComponent implements OnInit {

  public level: DependencyLevel
  public flagGraph: OmniTrackFlagGraph

  private trackingPlanManager: TrackingPlanService

  public originalFlags: any

  public flagTypes: Array<FunctionFlag>

  constructor(private bottomSheetRef: MatBottomSheetRef<LockConfigurationSheetComponent>, @Inject(MAT_BOTTOM_SHEET_DATA) data: ConfigurationSheetData) {
    this.trackingPlanManager = data.trackingPlanManager
    this.level = data.level
    this.originalFlags = data.model.lockedProperties ? deepclone(data.model.lockedProperties) : {}

    switch (this.level) {
      case DependencyLevel.App:
        this.flagGraph = OmniTrackFlagGraph.wrapAppFlags(this.originalFlags)
        break;

      case DependencyLevel.Tracker:
        this.flagGraph = OmniTrackFlagGraph.wrapTrackerFlags(
          this.originalFlags,
          this.trackingPlanManager.currentPlan.appLevelFlags
        )
        break;
      case DependencyLevel.Field:
        this.flagGraph = OmniTrackFlagGraph.wrapFieldFlags(
          this.originalFlags,
          this.trackingPlanManager.getTrackerOfField(data.model).lockedProperties,
          this.trackingPlanManager.currentPlan.appLevelFlags
        )
        break;

      case DependencyLevel.Trigger:
        this.flagGraph = OmniTrackFlagGraph.wrapTriggerFlags(
          this.originalFlags,
          this.trackingPlanManager.currentPlan.appLevelFlags
        )
        break;
      case DependencyLevel.Reminder:
        this.flagGraph = OmniTrackFlagGraph.wrapReminderFlags(
          this.originalFlags,
          this.trackingPlanManager.getTrackerOfReminder(data.model).lockedProperties,
          this.trackingPlanManager.currentPlan.appLevelFlags
        )
        break;
    }

    this.originalFlags = deepclone(this.originalFlags)

    const defaultFlag = OmniTrackFlagGraph.generateFlagWithDefault(this.level)
    this.flagTypes = Object.keys(defaultFlag).map(p => p as FunctionFlag)
  }

  visibleFlags(): Array<FunctionFlag> {
    return this.flagTypes.filter(f => this.wasOverwritten(f) === false && FLAG_VISIBILITY_DICT.get(this.level, f) !== false)
  }

  isFlagChanged(flag: FunctionFlag): boolean {
    return this.flagGraph.getRawFlag({ level: this.level, flag: flag }) !== this.originalFlags[flag]
  }

  isChanged(): boolean {
    return !deepEqual(this.originalFlags, this.flagGraph.getFlags(this.level))
  }

  getFlag(key: FunctionFlag): boolean {
    return this.flagGraph.getCascadedFlag({ level: this.level, flag: key })
  }

  wasOverwritten(key: FunctionFlag): boolean {
    return this.flagGraph.areParentsFalse({ level: this.level, flag: key })
  }

  setFlag(key: FunctionFlag, allowed: boolean) {
    this.flagGraph.getFlags(this.level)[key] = allowed
  }

  getFlagName(key: FunctionFlag): string {
    return FUNCTION_FLAG_LABEL_HELPER.get(this.level, key).name
  }

  ngOnInit() {
  }

  onApplyClicked() {
    this.bottomSheetRef.dismiss(this.flagGraph.getFlags(this.level))
  }

}
