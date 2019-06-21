import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-selectable-menu-item',
  templateUrl: './selectable-menu-item.component.html',
  styleUrls: ['./selectable-menu-item.component.scss']
})
export class SelectableMenuItemComponent implements OnInit {

  @Output()
  onClick = new EventEmitter<void>()

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

}
