import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { TriggerConstants } from '../../../../../omnitrack/core/trigger-constants';
import { TrackingPlanService, TrackingPlanData } from '../tracking-plan.service';



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

  emitChange(){
    this.change.emit()
  }
}
