import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { TrackingPlanService } from '../tracking-plan.service';
import { TrackingPlanData } from '../../../../../omnitrack/core/tracking-plan-helper';



@Component({
  selector: 'app-tracking-plan-list-element',
  templateUrl: './tracking-plan-list-element.component.html',
  styleUrls: ['./tracking-plan-list-element.component.scss'],
  providers: [TrackingPlanService]
})
export class TrackingPlanListElementComponent implements OnInit {

  public plan: TrackingPlanData

  @Input("plan") set _plan(newPlan: TrackingPlanData) {
    this.plan = newPlan
    this.trackingPlanManager.currentPlan = newPlan
  }

  @Output() change = new EventEmitter<void>(false)

  constructor(public trackingPlanManager: TrackingPlanService) {

  }

  ngOnInit() {
  }

  onAppLevelFlagChanged(flags) {
    console.log(flags)
    if (this.plan.app) {
      this.plan.app.lockedProperties = flags
    }
    else {
      this.plan.app = { lockedProperties: flags }
    }
    this.emitChange()
  }

  emitChange() {
    this.change.emit()
  }
}
