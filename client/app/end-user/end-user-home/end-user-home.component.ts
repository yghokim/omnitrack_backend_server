import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-end-user-home',
  templateUrl: './end-user-home.component.html',
  styleUrls: ['./end-user-home.component.scss']
})
export class EndUserHomeComponent implements OnInit {

  tablinks = [
    {
      label: "Dashboard",
      path: "/tracking/dashboard"
    },
    {
      label: "Trackers",
      path: "/tracking/trackers"
    },
    {
      label: "Triggers",
      path: "/tracking/triggers"
    }
  ]

  constructor() { }

  ngOnInit() {
  }

}
