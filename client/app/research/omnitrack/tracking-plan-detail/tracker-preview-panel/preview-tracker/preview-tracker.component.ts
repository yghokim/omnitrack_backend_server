import { Component, OnInit, Input, ElementRef, Output, EventEmitter } from '@angular/core';
import { ITrackerDbEntity, IFieldDbEntity, IDescriptionPanelDbEntity } from '../../../../../../../omnitrack/core/db-entity-types';
import { getTrackerColorString } from '../../../omnitrack-helper';
import * as color from 'color';
import { AMeasureFactory } from '../../../../../../../omnitrack/core/value-connection/measure-factory';
import { MeasureFactoryManager } from '../../../../../../../omnitrack/core/value-connection/measure-factory.manager';
import { trigger, transition, style, animate } from '@angular/animations';
import * as marked from 'marked';

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

  @Input()
  highlight = false

  @Input()
  highlightedFieldId: string = null

  @Input()
  highlightedDescriptionPanelId: string = null

  @Output()
  onHeaderMouseEnter = new EventEmitter<void>()

  @Output()
  onHeaderMouseLeave = new EventEmitter<void>()

  @Output()
  onHeaderClick = new EventEmitter<void>()

  @Output()
  onFieldClick = new EventEmitter<IFieldDbEntity>()

  @Output()
  onFieldMouseEnter = new EventEmitter<IFieldDbEntity>()

  @Output()
  onFieldMouseLeave = new EventEmitter<string>()


  @Output()
  onDescriptionPanelClick = new EventEmitter<IDescriptionPanelDbEntity>()

  @Output()
  onDescriptionPanelMouseEnter = new EventEmitter<IDescriptionPanelDbEntity>()

  @Output()
  onDescriptionPanelMouseLeave = new EventEmitter<string>()


  isHeaderHovering = false

  currentHoveringFieldId: string = null

  currentHoveringDescriptionPanelId: string = null

  get elementBound(): { x: number, y: number, width: number, height: number } {
    return { x: this.elementRef.nativeElement.offsetLeft, y: this.elementRef.nativeElement.offsetTop, width: this.elementRef.nativeElement.clientWidth, height: this.elementRef.nativeElement.clientHeight }
  }

  constructor(private elementRef: ElementRef) {

  }

  ngOnInit() {

  }

  getTrackerColorString(): string {
    const c = color(getTrackerColorString(this.tracker))
    return c.darken(0.2).desaturate(0.3)
  }

  getAttachedFactory(field: IFieldDbEntity): AMeasureFactory {
    return MeasureFactoryManager.getMeasureFactoryByCode(field.connection.measure.code)
  }

  onHeaderMouseEntered() {
    this.isHeaderHovering = true
    this.onHeaderMouseEnter.emit()
  }

  onHeaderMouseLeaved() {
    this.isHeaderHovering = false
    this.onHeaderMouseLeave.emit()
  }

  onHeaderClicked() { this.onHeaderClick.emit() }

  onFieldMouseEntered(field: IFieldDbEntity) {
    this.currentHoveringFieldId = field._id
    this.onFieldMouseEnter.emit(field)
  }

  onFieldMouseLeaved(field: IFieldDbEntity) {
    this.currentHoveringFieldId = null
    this.onFieldMouseLeave.emit(field._id)
  }

  onFieldClicked(field: IFieldDbEntity){
    this.onFieldClick.emit(field)
  }


  onDescriptionPanelMouseEntered(panel: IDescriptionPanelDbEntity) {
    this.currentHoveringDescriptionPanelId = panel._id
    this.onFieldMouseEnter.emit(panel)
  }

  onDescriptionPanelMouseLeaved(panel: IDescriptionPanelDbEntity) {
    this.currentHoveringDescriptionPanelId = null
    this.onFieldMouseLeave.emit(panel._id)
  }

  onDescriptionPanelClicked(panel: IDescriptionPanelDbEntity){
    this.onDescriptionPanelClick.emit(panel)
  }

  getFieldById(id: string): IFieldDbEntity{
    return this.tracker.fields.find(f => f._id === id)
  }

  getDescriptionPanelById(id: string): IDescriptionPanelDbEntity{
    return this.tracker.descriptionPanels.find(f => f._id === id)
  }

  transformMarkdownToHtml(markdown: string): string {
    return marked(markdown)
  }
}
