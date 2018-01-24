import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-table-cell-value',
  templateUrl: './table-cell-value.component.html',
  styleUrls: ['./table-cell-value.component.scss']
})
export class TableCellValueComponent implements OnInit {

  @Input() value: any = undefined

  constructor() { }

  ngOnInit() {
  }

  getValueType(): string{
    return typeof this.value
  }

}
