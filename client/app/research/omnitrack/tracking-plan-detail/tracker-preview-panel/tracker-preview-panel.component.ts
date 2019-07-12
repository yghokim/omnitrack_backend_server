import { Component, OnDestroy, OnInit, ElementRef, ViewChild, HostListener, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { TrackingPlan } from '../../../../../../omnitrack/core/tracking-plan';
import { TrackingPlanService } from '../../tracking-plan.service';
import { Subscription } from 'rxjs';
import { ResizedEvent } from 'angular-resize-event';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { ITriggerDbEntity } from 'omnitrack/core/db-entity-types';
import { PreviewTriggerComponent } from './preview-trigger/preview-trigger.component';
import { PreviewTrackerComponent } from './preview-tracker/preview-tracker.component';

@Component({
  selector: 'app-tracker-preview-panel',
  templateUrl: './tracker-preview-panel.component.html',
  styleUrls: ['./tracker-preview-panel.component.scss']
})
export class TrackerPreviewPanelComponent implements OnInit, OnDestroy, AfterViewInit {

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

  readonly maxScale = 3

  @ViewChildren(PreviewTriggerComponent) triggerComponents: QueryList<PreviewTriggerComponent>
  @ViewChildren(PreviewTrackerComponent) trackerComponents: QueryList<PreviewTrackerComponent>
  

  get scalePercent(): number{
    return (Math.round(this.scale * 10000)/100)
  }

  set scalePercent(percent: number){
    this.scale = this.clamp(Math.round(percent*100)/10000, this.minimumZoomLevel(), this.maxScale)
  }

  viewPortMouseDownX: number = null
  viewPortMouseDownY: number = null
  viewPortMouseDownScrollLeft: number = null
  viewPortMouseDownScrollTop: number = null


  @ViewChild("viewPort")
  viewPortRef: ElementRef

  constructor(private planService: TrackingPlanService, private sanitizer: DomSanitizer) {
    this.plan = planService.currentPlan
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }

  onContentResized(event: ResizedEvent) {
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
    if (realContentWidth < this.viewPortWidth - 2 * this.horizontalPaddingSize) {
      return ((this.viewPortWidth - (realContentWidth + 2 * this.horizontalPaddingSize * this.scale)) * .5) + "px"
    } else return "0px"
  }


  centerBiasY(): string {
    const realContentHeight = this.contentHeight * this.scale
    if (realContentHeight < this.viewPortHeight - 2 * this.verticalPaddingSize) {
      return ((this.viewPortHeight - (realContentHeight + 2 * this.verticalPaddingSize * this.scale)) * .5) + "px"
    } else return "0px"
  }

  makeTransform(): SafeStyle {
    const bX = this.centerBiasX()
    const bY = this.centerBiasY()
    const translate = (bX != null && bY != null) ? ("translate(" + bX + "," + bY + ")") : ""
    return this.sanitizer.bypassSecurityTrustStyle(translate + "scale(" + this.scale + ")")
  }

  minimumZoomLevel(): number {
    if (this.contentWidth > 0 && this.contentHeight > 0) {
      const horizontalLevel = Math.max((this.viewPortWidth - 20), 100) / (this.contentWidth + 2 * this.horizontalPaddingSize)

      const verticalLevel = Math.max((this.viewPortHeight - 20), 100) / (this.contentHeight + 2 * this.verticalPaddingSize)
      return Math.min(horizontalLevel, verticalLevel)
    } else return 1
  }

  zoomOut() {
    this.scale -= 0.1;
    this.scale = Math.max(this.scale, this.minimumZoomLevel())
  }

  zoomIn() {
    this.scale = this.clamp(this.scale + 0.1, this.minimumZoomLevel(), this.maxScale);
  }

  fitView() {
    console.log(this.minimumZoomLevel())
    this.scale = this.minimumZoomLevel()
  }



  onMouseDownInViewPort(event: MouseEvent) {
    console.log("startDrag")
    this.viewPortMouseDownX = event.clientX
    this.viewPortMouseDownY = event.clientY

    this.viewPortMouseDownScrollLeft = this.viewPortRef.nativeElement.scrollLeft
    this.viewPortMouseDownScrollTop = this.viewPortRef.nativeElement.scrollTop
    event.stopPropagation()
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    this.viewPortMouseDownX = null
    this.viewPortMouseDownY = null

    this.viewPortMouseDownScrollLeft = null
    this.viewPortMouseDownScrollTop = null
  }

  onMouseMoveInViewPort(event: MouseEvent) {
    if (this.viewPortMouseDownX != null) {
      const deltaX = event.clientX - this.viewPortMouseDownX
      const deltaY = event.clientY - this.viewPortMouseDownY

      const newScrollLeft = this.clamp(this.viewPortMouseDownScrollLeft - deltaX, 0, this.viewPortRef.nativeElement.scrollLeftMax)
      const newScrollTop = this.clamp(this.viewPortMouseDownScrollTop - deltaY, 0, this.viewPortRef.nativeElement.scrollTopMax)

      this.viewPortRef.nativeElement.scrollLeft = newScrollLeft
      this.viewPortRef.nativeElement.scrollTop = newScrollTop

      event.stopPropagation()
    }
  }

  clamp(value, min, max): number {
    return Math.min(max, Math.max(value, min))
  }

  getSortedTriggers(): Array<ITriggerDbEntity>{
    if(this.plan && this.plan.triggers){
      const triggerList = this.plan.triggers.slice(0)
      return triggerList
    }else{
      return null
    }
  }

  ngAfterViewInit(){
    console.log(this.trackerComponents)
  }

}