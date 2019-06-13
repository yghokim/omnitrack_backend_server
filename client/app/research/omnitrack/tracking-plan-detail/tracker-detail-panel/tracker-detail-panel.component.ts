import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tracker-detail-panel',
  templateUrl: './tracker-detail-panel.component.html',
  styleUrls: ['./tracker-detail-panel.component.scss', "../tracking-plan-detail.component.scss"],
  host: {class: 'menu-panel sidepanel-container'}
})
export class TrackerDetailPanelComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
