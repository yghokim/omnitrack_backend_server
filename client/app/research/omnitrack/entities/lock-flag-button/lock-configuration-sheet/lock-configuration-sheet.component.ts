import { Component, OnInit, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { deepclone, merge } from '../../../../../../../shared_lib/utils';
import * as deepEqual from 'deep-equal';
import { FunctionFlag, DependencyLevel, OmniTrackFlagGraph } from '../../../../../../../omnitrack/core/functionality-locks/omnitrack-dependency-graph';
import { TrackingPlanService } from '../../../tracking-plan.service';
import { FUNCTION_FLAG_LABEL_HELPER, FLAG_VISIBILITY_DICT } from '../../../function-flag-label-helper';
import { trigger, transition, style, animate } from '@angular/animations';

export interface ConfigurationSheetData {
  level: DependencyLevel,
  model: any,
  trackingPlanManager: TrackingPlanService
}

@Component({
  selector: 'app-lock-configuration-sheet',
  templateUrl: './lock-configuration-sheet.component.html',
  styleUrls: ['./lock-configuration-sheet.component.scss'],
  animations: [
    trigger('showHideTrigger', [
      transition(':enter', [
        style({ opacity: 0, height: 0 }),
        animate('0.25s ease-out', style({ opacity: 1, height: "*" })),
      ]),
      transition(':leave', [
        animate('0.2s ease-out', style({ opacity: 0, height: 0 }))
      ])
    ]),
  ]
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

    const defaultFlag = OmniTrackFlagGraph.generateFlagWithDefault(this.level)
    
    this.flagGraph = this.trackingPlanManager.generateFlagGraph(this.level, data.model)

    this.originalFlags = deepclone(this.flagGraph.getFlagObject(this.level))

    this.flagTypes = Object.keys(defaultFlag).map(p => p as FunctionFlag)
  }

  visibleFlags(): Array<FunctionFlag> {
    return this.flagTypes.filter(f => this.wasOverwritten(f) === false && FLAG_VISIBILITY_DICT.get(this.level, f) !== false)
  }

  isFlagVisible(flag: FunctionFlag): boolean{
    return this.wasOverwritten(flag) === false && FLAG_VISIBILITY_DICT.get(this.level, flag) !== false
  }

  getHierarchyLevel(flag: FunctionFlag): number{
    return this.flagGraph.hierarchyInSameLevel(this.level, flag)
  }

  isFlagChanged(flag: FunctionFlag): boolean {
    return this.flagGraph.getRawFlag({ level: this.level, flag: flag }) !== this.originalFlags[flag]
  }

  isChanged(): boolean {
    return !deepEqual(this.originalFlags, this.flagGraph.getFlagObject(this.level))
  }

  getFlag(key: FunctionFlag): boolean {
    return this.flagGraph.getCascadedFlag({ level: this.level, flag: key })
  }

  wasOverwritten(key: FunctionFlag): boolean {
    return this.flagGraph.areParentsFalse({ level: this.level, flag: key })
  }

  setFlag(key: FunctionFlag, allowed: boolean) {
    this.flagGraph.getFlagObject(this.level)[key] = allowed
  }

  getFlagName(key: FunctionFlag): string {
    return FUNCTION_FLAG_LABEL_HELPER.get(this.level, key).name
  }

  ngOnInit() {
  }

  onApplyClicked() {
    this.bottomSheetRef.dismiss(this.flagGraph.getFlagObject(this.level))
  }

}
