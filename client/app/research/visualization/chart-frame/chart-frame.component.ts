import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-chart-frame',
  templateUrl: './chart-frame.component.html',
  styleUrls: ['./chart-frame.component.scss']
})
export class ChartFrameComponent implements OnInit {

  @Input() title: string = ""

  @Input() isBusy: boolean = true

  constructor() { }

  ngOnInit() {
  }

}
