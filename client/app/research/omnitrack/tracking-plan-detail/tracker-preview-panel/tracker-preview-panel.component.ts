import { Component, OnDestroy, OnInit } from '@angular/core';
import { TrackingPlan } from '../../../../../../omnitrack/core/tracking-plan';
import { TrackingPlanService } from '../../tracking-plan.service';
import { Subscription } from 'rxjs';
import { ResizedEvent } from 'angular-resize-event';

@Component({
  selector: 'app-tracker-preview-panel',
  templateUrl: './tracker-preview-panel.component.html',
  styleUrls: ['./tracker-preview-panel.component.scss']
})
export class TrackerPreviewPanelComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()

  plan: TrackingPlan

  readonly paddingRatio = 0.2

  public contentWidth: number = 0
  public contentHeight: number = 0

  public viewPortWidth: number = 0
  public viewPortHeight: number = 0

  public dX: number = 0
  public dY: number = 0
  public scale: number = 0.5

  constructor(private planService: TrackingPlanService) {
    this.plan = planService.currentPlan
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }

  onContentResized(event: ResizedEvent) {
    console.log("width: ", event.oldWidth, " to ", event.newWidth)
    console.log("height: ", event.oldHeight, " to ", event.newHeight)
    
    this.contentWidth = event.newWidth
    this.contentHeight = event.newHeight
    this.scale = Math.max(this.minimumZoomLevel(), this.scale)
  }

  onViewPortResized(event: ResizedEvent) {
    this.viewPortWidth = event.newWidth
    this.viewPortHeight = event.newHeight
    this.scale = Math.max(this.minimumZoomLevel(), this.scale)
  }

  get horizontalPaddingSize(): number {
    return this.viewPortWidth * this.paddingRatio
  }

  get verticalPaddingSize(): number {
    return this.viewPortHeight * this.paddingRatio
  }

  centerBiasX(): string {
    const realContentWidth = this.contentWidth * this.scale
    if (realContentWidth < this.viewPortWidth - 2*this.horizontalPaddingSize) {
      return ((this.viewPortWidth - (realContentWidth + 2*this.horizontalPaddingSize*this.scale)) * .5) + "px"
    } else return null
  }


  centerBiasY(): string {
    const realContentHeight = this.contentHeight * this.scale
    if (realContentHeight < this.viewPortHeight - 2*this.verticalPaddingSize) {
      return ((this.viewPortHeight - (realContentHeight + 2*this.verticalPaddingSize*this.scale)) * .5) + "px"
    } else return null
  }

  minimumZoomLevel(): number {
    if (this.contentWidth > 0 && this.contentHeight > 0) {
      const horizontalLevel = Math.max((this.viewPortWidth - 20), 100) / (this.contentWidth + 2 * this.horizontalPaddingSize)

      const verticalLevel = Math.max((this.viewPortHeight - 20), 100)/ (this.contentHeight + 2 * this.verticalPaddingSize)
      return Math.min(horizontalLevel, verticalLevel)
    } else return 1
  }

  zoomOut() {
    this.scale -= 0.1;
    this.scale = Math.max(this.scale, this.minimumZoomLevel())
  }

  zoomIn() {
    this.scale += 0.1;
  }

  fitView(){
    console.log(this.minimumZoomLevel())
    this.scale = this.minimumZoomLevel()
  }
}