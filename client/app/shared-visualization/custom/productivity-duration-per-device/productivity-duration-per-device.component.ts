import { Component, OnInit, Input } from '@angular/core';
import { DecodedItem } from '../productivity-dashboard/productivity-dashboard.component';

@Component({
  selector: 'app-productivity-duration-per-device',
  templateUrl: './productivity-duration-per-device.component.html',
  styleUrls: ['./productivity-duration-per-device.component.scss']
})
export class ProductivityDurationPerDeviceComponent implements OnInit {

  @Input('decodedItems')
  set _decodedItems(decodedItems: Array<DecodedItem>) {
  }

  public chart

  constructor() { }

  ngOnInit() {
  }

}
