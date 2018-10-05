import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-tree-view-element',
  templateUrl: './tree-view-element.component.html',
  styleUrls: ['./tree-view-element.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeViewElementComponent implements OnInit {

  @Input() isLeaf: boolean = false
  @Input() isOpen: boolean = false
  @Input() cascadingLevel: number = 0

  @Input() isSelectable: boolean = false
  @Input() isHighlighted: boolean = false
  @Input() selectionData: any = null
  @Output() treeItemClick = new EventEmitter<any>()

  constructor() { }

  ngOnInit() {

  }

  onClicked() {
    if (this.isSelectable === true)
      this.treeItemClick.emit(this.selectionData)
    else if (this.isLeaf === false) {
      //mother
      this.isOpen = !this.isOpen
    }
  }

  onIconClicked(event) {
    event.stopPropagation();
    if (this.isLeaf === false) {
      //mother
      this.isOpen = !this.isOpen
    }
  }

}
