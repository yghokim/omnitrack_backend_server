import { Component, OnDestroy, OnInit } from '@angular/core';
import { TrackingPlan } from '../../../../../../omnitrack/core/tracking-plan';
import { TrackingPlanService } from '../../tracking-plan.service';
import { PanZoomConfig, PanZoomAPI } from 'ng2-panzoom';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tracker-preview-panel',
  templateUrl: './tracker-preview-panel.component.html',
  styleUrls: ['./tracker-preview-panel.component.scss']
})
export class TrackerPreviewPanelComponent implements OnInit, OnDestroy{

  private _internalSubscriptions = new Subscription()

  plan: TrackingPlan

  panzoomConfig: PanZoomConfig = new PanZoomConfig()
  
  panzoomApi: PanZoomAPI

  constructor(private planService: TrackingPlanService){
    this.plan = planService.currentPlan
  }

  ngOnInit(): void {
    this._internalSubscriptions.add(
      this.panzoomConfig.api.subscribe(api => {
        this.panzoomApi = api
      })
    )
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }
  
}