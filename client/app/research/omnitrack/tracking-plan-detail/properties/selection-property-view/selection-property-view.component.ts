import { Component, OnInit, Input } from '@angular/core';
import { PropertyViewBase } from '../property-view-base';

@Component({
  selector: 'app-selection-property-view',
  templateUrl: './selection-property-view.component.html',
  styleUrls: ['./selection-property-view.component.scss', '../property-views.scss']
})
export class SelectionPropertyViewComponent extends PropertyViewBase<number> implements OnInit {

  @Input()
  list: Array<{id: number, name: string}>

  @Input()
  set stringList(list: Array<string>){
    this.list = list.map((e, i) => ({id: i, name: e}))
  }

  onSetConfiguration(config: any){
    this.list = config.list
    if(config.stringList){
      this.stringList = config.stringList
    }
  }

  ngOnInit() {
  }

}
