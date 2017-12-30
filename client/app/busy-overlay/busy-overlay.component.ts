import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'busy-overlay',
  templateUrl: './busy-overlay.component.html',
  styleUrls: ['./busy-overlay.component.scss']
})
export class BusyOverlayComponent implements OnInit {

  @Input()
  scale = 1.0


  constructor() { }

  ngOnInit() {
  }
}
