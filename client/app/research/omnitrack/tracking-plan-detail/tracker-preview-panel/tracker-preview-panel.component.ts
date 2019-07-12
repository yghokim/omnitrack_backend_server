import { Component, OnDestroy, OnInit, ElementRef, ViewChild, HostListener, ViewChildren, QueryList, AfterViewInit, AfterContentChecked, Renderer2 } from '@angular/core';
import { TrackingPlan } from '../../../../../../omnitrack/core/tracking-plan';
import { TrackingPlanService } from '../../tracking-plan.service';
import { Subscription } from 'rxjs';
import { ResizedEvent } from 'angular-resize-event';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { ITriggerDbEntity, ITrackerDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import { PreviewTriggerComponent, EConnectorType } from './preview-trigger/preview-trigger.component';
import { PreviewTrackerComponent } from './preview-tracker/preview-tracker.component';
import { TriggerConstants } from '../../../../../../omnitrack/core/trigger/trigger-constants';

export interface ConnectionLineInfo {
  type: EConnectorType,
  from: ITriggerDbEntity,
  to: ITrackerDbEntity,
  fromPosition: { x: number, y: number },
  toPosition: { x: number, y: number }
}

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

  readonly maxScale = 3

  @ViewChildren(PreviewTriggerComponent) triggerComponents: QueryList<PreviewTriggerComponent>
  @ViewChildren(PreviewTrackerComponent) trackerComponents: QueryList<PreviewTrackerComponent>


  get scalePercent(): number {
    return (Math.round(this.scale * 10000) / 100)
  }

  set scalePercent(percent: number) {
    this.scale = this.clamp(Math.round(percent * 100) / 10000, this.minimumZoomLevel(), this.maxScale)
  }

  viewPortMouseDownX: number = null
  viewPortMouseDownY: number = null
  viewPortMouseDownScrollLeft: number = null
  viewPortMouseDownScrollTop: number = null

  disposeGlobalMouseMoveEvent: () => void = null


  @ViewChild("viewPort")
  viewPortRef: ElementRef

  constructor(private planService: TrackingPlanService, private sanitizer: DomSanitizer, private renderer: Renderer2) {
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
    this.scale = this.minimumZoomLevel()
  }



  onMouseDownInViewPort(event: MouseEvent) {
    this.viewPortMouseDownX = event.clientX
    this.viewPortMouseDownY = event.clientY

    this.viewPortMouseDownScrollLeft = this.viewPortRef.nativeElement.scrollLeft
    this.viewPortMouseDownScrollTop = this.viewPortRef.nativeElement.scrollTop
    
    this.disposeGlobalMouseMoveEvent = this.renderer.listen('window', 'mousemove', (event) => {this.onMouseMoveInViewPort(event)})
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    this.viewPortMouseDownX = null
    this.viewPortMouseDownY = null

    this.viewPortMouseDownScrollLeft = null
    this.viewPortMouseDownScrollTop = null

    if(this.disposeGlobalMouseMoveEvent){
      this.disposeGlobalMouseMoveEvent()
      this.disposeGlobalMouseMoveEvent = null
    }
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

  getSortedTriggers(): Array<ITriggerDbEntity> {
    if (this.plan && this.plan.triggers) {
      const triggerList = this.plan.triggers.slice(0)
      return triggerList
    } else {
      return null
    }
  }

  getSortedTrackers(): Array<ITrackerDbEntity> {
    if (this.plan && this.plan.trackers) {
      const trackerList = this.plan.trackers.slice(0)
      trackerList.sort((a, b)=>{
        if(a.position > b.position){
          return 1
        }else if(a.position < b.position){
          return -1
        }else return 0
      })
      return trackerList
    } else {
      return null
    }
  }

  getConnectionColor(connectionInfo: ConnectionLineInfo): string {
    switch (connectionInfo.type) {
      case EConnectorType.Main:
        switch (connectionInfo.from.actionType) {
          case TriggerConstants.ACTION_TYPE_LOG:
            return "#575757"
          case TriggerConstants.ACTION_TYPE_REMIND:
            return "#575757"
        }
        break;
      case EConnectorType.Script:
        return "#c28c8c"
    }
  }

  getConnectionDashArray(connectionInfo: ConnectionLineInfo): string {
    switch (connectionInfo.type) {
      case EConnectorType.Main:
        return null
      case EConnectorType.Script:
        return "4 2"
    }
  }

  trackByObjectId(index: number, obj: any) {
    return obj._id
  }

  trackByConnectionInfo(index: number, info: ConnectionLineInfo) {
    return info.type + " " + info.from._id + " " + info.to._id
  }

  get connectionLineInfo(): Array<ConnectionLineInfo> {
    const list = new Array<ConnectionLineInfo>()
    if (this.triggerComponents && this.trackerComponents && this.plan && this.plan.triggers && this.plan.trackers) {
      this.plan.triggers.forEach(trigger => {
        if (trigger.trackers && trigger.trackers.length > 0) {
          const triggerComponent = this.triggerComponents.find(t => t.trigger._id === trigger._id)
          if (triggerComponent) {
            //main connector
            const trackerComponents = this.trackerComponents.filter(t => trigger.trackers.indexOf(t.tracker._id) !== -1)
            trackerComponents.forEach(trackerComponent => {
              const mainConnector = triggerComponent.connectorPoints.find(p => p.type == EConnectorType.Main)
              const trackerBound = trackerComponent.elementBound
              list.push({
                type: mainConnector.type,
                from: trigger,
                to: trackerComponent.tracker,
                fromPosition: { x: mainConnector.x, y: mainConnector.y },
                toPosition: { x: trackerBound.x + trackerBound.width * .5, y: trackerBound.y }
              })
            })

            //script connector
            if (trigger.script && trigger.checkScript === true) {
              this.trackerComponents.forEach(t => {
                if (trigger.script.includes(t.tracker._id)) {
                  const scriptConnector = triggerComponent.connectorPoints.find(p => p.type == EConnectorType.Script)
                  const trackerBound = t.elementBound
                  list.push({
                    type: scriptConnector.type,
                    from: trigger,
                    to: t.tracker,
                    fromPosition: { x: scriptConnector.x, y: scriptConnector.y },
                    toPosition: { x: trackerBound.x + trackerBound.width * .5, y: trackerBound.y }
                  })
                }
              })
            }
          }
        }
      })
    }

    return list
  }

  createSvgPath(from: { x: number, y: number }, to: { x: number, y: number }): string {

    const start = "M " + from.x + " " + from.y
    const curve = "C " + from.x + " " + (from.y + (to.y - from.y) * 0.8) + ", " + to.x + " " + (to.y + (from.y - to.y) * 0.6) + ", " + to.x + " " + to.y

    return start + " " + curve
  }
}