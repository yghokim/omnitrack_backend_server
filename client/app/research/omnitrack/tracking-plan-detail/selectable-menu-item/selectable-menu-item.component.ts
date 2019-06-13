import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-selectable-menu-item',
  templateUrl: './selectable-menu-item.component.html',
  styleUrls: ['./selectable-menu-item.component.scss']
})
export class SelectableMenuItemComponent implements OnInit {

  @Output()
  onClick = new EventEmitter<void>()

  @Input()
  title: string

  @Input()
  color: string

  @Input()
  selected: boolean = true

  constructor() { }

  ngOnInit() {
  }

  onClicked(){
    this.onClick.emit()
  }

}
