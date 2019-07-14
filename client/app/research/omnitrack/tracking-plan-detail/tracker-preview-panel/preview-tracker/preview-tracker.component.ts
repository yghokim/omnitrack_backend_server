import { Component, OnInit, Input, ElementRef, Output, EventEmitter } from '@angular/core';
import { ITrackerDbEntity, IFieldDbEntity } from '../../../../../../../omnitrack/core/db-entity-types';
import { getTrackerColorString } from '../../../omnitrack-helper';
import * as color from 'color';
import { AMeasureFactory } from '../../../../../../../omnitrack/core/value-connection/measure-factory';
import { MeasureFactoryManager } from '../../../../../../../omnitrack/core/value-connection/measure-factory.manager';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-preview-tracker',
  templateUrl: './preview-tracker.component.html',
  styleUrls: ['./preview-tracker.component.scss'],
  animations: [
    trigger("hoverTrigger", [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.25s', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('0.2s', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class PreviewTrackerComponent implements OnInit {

  @Input()
  tracker: ITrackerDbEntity

  @Output()
  onHeaderMouseEnter = new EventEmitter<void>()

  @Output()
  onHeaderMouseLeave = new EventEmitter<void>()

  isHeaderHovering = false


  get elementBound(): {x: number, y: number, width: number, height: number}{
    return {x: this.elementRef.nativeElement.offsetLeft, y: this.elementRef.nativeElement.offsetTop, width: this.elementRef.nativeElement.clientWidth, height: this.elementRef.nativeElement.clientHeight}
  }

  constructor(private elementRef: ElementRef) {

  }

  ngOnInit() {

  }

  getTrackerColorString(): string{
    const c = color(getTrackerColorString(this.tracker))
    return c.darken(0.2).desaturate(0.3)
  }

  getAttachedFactory(field: IFieldDbEntity): AMeasureFactory{
    return MeasureFactoryManager.getMeasureFactoryByCode(field.connection.measure.code)
  }

  onHeaderMouseEntered(){
    this.isHeaderHovering = true
    this.onHeaderMouseEnter.emit()
  }

  onHeaderMouseLeaved(){
    this.isHeaderHovering = false
    this.onHeaderMouseLeave.emit()
  }

}
