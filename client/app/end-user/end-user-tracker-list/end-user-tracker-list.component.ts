import { Component, OnInit } from '@angular/core';
import { EndUserApiService } from '../services/end-user-api.service';

@Component({
  selector: 'app-end-user-tracker-list',
  templateUrl: './end-user-tracker-list.component.html',
  styleUrls: ['./end-user-tracker-list.component.scss']
})
export class EndUserTrackerListComponent implements OnInit {

  constructor(public api: EndUserApiService) {
   }

  ngOnInit() {
    this.api.loadTrackers()
  }

}
