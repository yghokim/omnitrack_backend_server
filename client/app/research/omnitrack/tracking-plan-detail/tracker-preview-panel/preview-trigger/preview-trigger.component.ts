import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { ITriggerDbEntity } from '../../../../../../../omnitrack/core/db-entity-types';
import { TriggerConstants } from '../../../../../../../omnitrack/core/trigger/trigger-constants';
import { ResizedEvent } from 'angular-resize-event';

export enum EConnectorType{
  Main, Script
}

export interface ConnectorPoint{
  x: number,
  y: number,
  type: EConnectorType
}

@Component({
  selector: 'app-preview-trigger',
  templateUrl: './preview-trigger.component.html',
  styleUrls: ['./preview-trigger.component.scss']
})
export class PreviewTriggerComponent implements OnInit {

  @Input()
  trigger: ITriggerDbEntity

  @Output()
  onConnectorPositionChanged = new EventEmitter<Array<ConnectorPoint>>()

  private _connectorPoints: Array<ConnectorPoint>

  get connectorPoints(): Array<ConnectorPoint>{
    return this._connectorPoints
  }

  @ViewChild("connector_main")
  mainConnectorPointRef: ElementRef

  @ViewChild("connector_script")
  scriptConnectorPointRef: ElementRef

  constructor(private elementRef: ElementRef) { }

  ngOnInit() {
  }

  get typeName(): string {
    if (this.trigger) {
      switch (this.trigger.actionType) {
        case TriggerConstants.ACTION_TYPE_LOG:
          return "Background Logging Trigger"
        case TriggerConstants.ACTION_TYPE_REMIND:
          return "Reminder"
      }
    } else return null
  }

  get mainConnectorName(): string{
    if (this.trigger) {
      switch (this.trigger.actionType) {
        case TriggerConstants.ACTION_TYPE_LOG:
          return "automatically logs"
        case TriggerConstants.ACTION_TYPE_REMIND:
          return "reminds"
      }
    } else return null
  }

  onCardResized(event: ResizedEvent){

    const triggerPositionX = this.elementRef.nativeElement.offsetLeft
    const triggerPositionY = this.elementRef.nativeElement.offsetTop
    
    const mainConnectorPointLeft = this.mainConnectorPointRef.nativeElement.offsetLeft
    const mainConnectorPointTop = this.mainConnectorPointRef.nativeElement.offsetTop
    const scriptConnectorPointLeft = this.scriptConnectorPointRef.nativeElement.offsetLeft
    const scriptConnectorPointTop = this.scriptConnectorPointRef.nativeElement.offsetTop
    
    this._connectorPoints = [
      {
        x: mainConnectorPointLeft + this.mainConnectorPointRef.nativeElement.clientWidth*.5,
        y: mainConnectorPointTop + this.mainConnectorPointRef.nativeElement.clientHeight*.5,
        type: EConnectorType.Main
      },
      {
        x: scriptConnectorPointLeft + this.scriptConnectorPointRef.nativeElement.clientWidth*.5,
        y: scriptConnectorPointTop + this.scriptConnectorPointRef.nativeElement.clientHeight*.5,
        type: EConnectorType.Script
      },
    ]

    this._connectorPoints.forEach(p => {
      p.x += triggerPositionX
      p.y += triggerPositionY
    })

    this.onConnectorPositionChanged.emit(this._connectorPoints)

    console.log(this._connectorPoints)

  }
}

