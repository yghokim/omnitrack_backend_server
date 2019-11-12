import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-selectable-menu-item',
  templateUrl: './selectable-menu-item.component.html',
  styleUrls: ['./selectable-menu-item.component.scss'],
  animations: [
    trigger("highlightTrigger", [
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
export class SelectableMenuItemComponent implements OnInit {

  @Output()
  onClick = new EventEmitter<void>()

  @Output()
  onMouseEnter = new EventEmitter<void>()

  @Output()
  onMouseLeave = new EventEmitter<void>()

  @Output()
  onRemoveClick = new EventEmitter<void>()

  @Input()
  showDragHandle = false

  @Input()
  showRemoveButton = false

  @Input()
  title: string

  @Input()
  subtitle: string

  @Input()
  color: string

  @Input()
  selected = false

  @Input()
  iconPath: string = null

  @Input()
  highlight = false

  isHovering = false

  constructor() { }

  ngOnInit() {
  }

  onClicked(){
    this.onClick.emit()
  }

  onRemoveClicked(event: MouseEvent){
    event.stopPropagation()
    this.onRemoveClick.emit()
  }

  onMouseEntered(){
    this.isHovering = true
    this.onMouseEnter.emit()
  }

  onMouseLeaved(){
    this.isHovering = false
    this.onMouseLeave.emit()
  }

}
